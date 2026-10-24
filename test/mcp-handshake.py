#!/usr/bin/env python3
"""Drive the OpenPub MCP server over stdio and assert real behaviour."""
import json, os, subprocess, sys, tempfile, time

SERVER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "apps", "mcp", "dist", "index.js")
HOME = os.path.join(tempfile.mkdtemp(prefix="openpub-mcp-"), "home")
POST = os.path.join(os.path.dirname(HOME), "post.md")

os.makedirs(HOME, exist_ok=True)
with open(POST, "w") as fh:
    fh.write("---\ntitle: MCP handshake fixture\ntags: [a, b]\n---\n\n# Heading\n\nSome body text.\n")

env = dict(os.environ, OPENPUB_HOME=HOME)

proc = subprocess.Popen(
    ["node", SERVER],
    stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    env=env, text=True, bufsize=1,
)

def send(obj):
    proc.stdin.write(json.dumps(obj) + "\n")
    proc.stdin.flush()

def read(timeout=15):
    # read one line of JSON, tolerating blank/notification lines
    deadline = time.time() + timeout
    while time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            return None
        line = line.strip()
        if not line:
            continue
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            continue
    return None

results = {}

# 1. initialize
send({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {"name": "openpub-test", "version": "1.0"},
}})
init = read()
results["initialize"] = bool(init and init.get("result", {}).get("serverInfo"))
server_info = (init or {}).get("result", {}).get("serverInfo", {})
print("initialize:", json.dumps(server_info))

send({"jsonrpc": "2.0", "method": "notifications/initialized"})

# 2. tools/list
send({"jsonrpc": "2.0", "id": 2, "method": "tools/list", "params": {}})
tl = read()
tools = [t["name"] for t in (tl or {}).get("result", {}).get("tools", [])]
print(f"tools/list: {len(tools)} tools -> {tools}")
results["tools"] = tools

# 3. tools/call status
send({"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "status", "arguments": {}}})
st = read()
st_text = (st or {}).get("result", {}).get("content", [{}])[0].get("text", "")
print("status ->", st_text[:300])
results["status_ok"] = bool(st_text)

# 4. tools/call content_audit on a real file
send({"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "content_audit", "arguments": {"file": POST}}})
au = read()
au_text = (au or {}).get("result", {}).get("content", [{}])[0].get("text", "")
print("content_audit ->", au_text[:300])
results["audit_ok"] = bool(au_text)

# 5. tools/call x_article in dry mode via publish (the wedge)
send({"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "publish", "arguments": {"file": POST, "platforms": ["github-pages"], "dryRun": True}}})
pu = read()
pu_text = (pu or {}).get("result", {}).get("content", [{}])[0].get("text", "")
print("publish(dryRun) ->", pu_text[:300])
results["publish_dry_ok"] = bool(pu_text)

proc.stdin.close()
try:
    proc.wait(timeout=5)
except subprocess.TimeoutExpired:
    proc.kill()

err = proc.stderr.read()[:600]
if err.strip():
    print("\nstderr:", err)

print("\n=== RESULT ===")
expected = {"publish", "cross_publish", "list_published", "setup", "status",
            "test_platform", "content_audit", "check_links", "frontmatter", "x_article"}
missing = expected - set(results.get("tools", []))
print("initialize ok :", results.get("initialize"))
print("tools found   :", len(results.get("tools", [])))
print("missing tools :", missing or "none")
print("status call   :", results.get("status_ok"))
print("audit call    :", results.get("audit_ok"))
print("publish dry   :", results.get("publish_dry_ok"))
ok = results.get("initialize") and not missing and results.get("audit_ok")
print("PASS" if ok else "FAIL")
sys.exit(0 if ok else 1)
