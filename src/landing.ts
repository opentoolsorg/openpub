export function landingHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenPost - Write once, publish everywhere</title>
<meta name="description" content="Self-hosted, Cloudflare-native cross-publisher for blogs. One markdown file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, and your own site.">
<style>
:root{--bg:#0c0d0e;--card:#121315;--line:#222427;--txt:#e8e9ea;--mut:#8a8d91;--acc:#34d399;--mono:ui-monospace,'SF Mono',Menlo,monospace}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--txt);line-height:1.6}
a{color:var(--txt);text-decoration:none}
.wrap{max-width:64rem;margin:0 auto;padding:0 1.5rem}
nav{display:flex;align-items:center;justify-content:space-between;height:64px;border-bottom:1px solid var(--line)}
.logo{font-family:var(--mono);font-size:1.05rem;font-weight:600}.logo b{color:var(--acc)}
.nav-links{display:flex;gap:1.5rem;font-size:.85rem;color:var(--mut)}
.nav-links a:hover{color:var(--txt)}
.btn{display:inline-block;padding:.6rem 1.25rem;border-radius:.5rem;font-size:.9rem;font-weight:500;border:1px solid var(--line);color:var(--txt);transition:border-color .15s}
.btn:hover{border-color:var(--mut)}
.btn.pri{background:var(--acc);color:#052e1f;border-color:var(--acc);font-weight:600}
.btn.pri:hover{background:#4be0a9}
.hero{padding:5rem 0 3.5rem}
.eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;color:var(--acc);text-transform:uppercase;margin-bottom:1.25rem}
h1{font-size:clamp(2.4rem,5.5vw,3.6rem);line-height:1.08;font-weight:650;letter-spacing:-.02em;max-width:16ch}
.sub{color:var(--mut);font-size:1.08rem;max-width:52ch;margin-top:1.25rem}
.cta{display:flex;gap:.75rem;margin-top:2rem;flex-wrap:wrap}
.plats{padding:2rem 0 2.5rem;border-top:1px solid var(--line)}
.plats-label{font-size:.78rem;color:var(--mut);margin-bottom:1.1rem}
.logo-row{display:flex;gap:2rem;align-items:center;flex-wrap:wrap}
.logo-row img{height:20px;opacity:.75;filter:grayscale(1) brightness(1.4)}
.logo-row img:hover{opacity:1}
.logo-row span{font-family:var(--mono);font-size:.95rem;color:var(--mut)}
.logo-row span:hover{color:var(--txt)}
section{padding:3.5rem 0}
h2{font-size:1.6rem;font-weight:600;letter-spacing:-.01em;margin-bottom:.5rem}
.sec-sub{color:var(--mut);font-size:.95rem;max-width:60ch;margin-bottom:2rem}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
.step{border-top:1px solid var(--line);padding-top:1.25rem}
.step .n{font-family:var(--mono);color:var(--acc);font-size:.8rem;margin-bottom:.5rem;display:block}
.step h3{font-size:1rem;font-weight:600;margin-bottom:.35rem}
.step p{font-size:.85rem;color:var(--mut)}
.bento{display:grid;grid-template-columns:repeat(6,1fr);gap:1rem}
.cell{background:var(--card);border:1px solid var(--line);border-radius:.75rem;padding:1.5rem;grid-column:span 2}
.cell.wide{grid-column:span 3}
.cell h3{font-size:.95rem;font-weight:600;margin-bottom:.4rem}
.cell p{font-size:.83rem;color:var(--mut)}
.cell .mono{font-family:var(--mono);font-size:.78rem;color:var(--acc)}
.term{background:#0a0b0c;border:1px solid var(--line);border-radius:.75rem;padding:1.25rem 1.5rem;font-family:var(--mono);font-size:.82rem;line-height:1.9;overflow-x:auto}
.term .c{color:var(--mut)}
.term .g{color:var(--acc)}
footer{border-top:1px solid var(--line);padding:2rem 0;font-size:.82rem;color:var(--mut);display:flex;justify-content:space-between;flex-wrap:wrap;gap:1rem}
footer a{color:var(--mut)}footer a:hover{color:var(--txt)}
@media(max-width:768px){.steps{grid-template-columns:1fr}.cell,.cell.wide{grid-column:span 6}.nav-links{display:none}}
</style>
</head>
<body>
<div class="wrap">
<nav>
  <a class="logo" href="/">open<b>post</b></a>
  <div class="nav-links">
    <a href="https://github.com/princepal9120/openpost">GitHub</a>
    <a href="https://github.com/princepal9120/openpost/blob/main/docs/DEPLOY.md">Docs</a>
    <a href="/dashboard">Dashboard</a>
  </div>
</nav>

<header class="hero">
  <div class="eyebrow">Self-hosted on Cloudflare free tier</div>
  <h1>Write once. Publish everywhere.</h1>
  <p class="sub">One markdown file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, and your own site. MCP server, CLI, and REST API included.</p>
  <div class="cta">
    <a class="btn pri" href="https://github.com/princepal9120/openpost">Star on GitHub</a>
    <a class="btn" href="https://github.com/princepal9120/openpost/blob/main/docs/DEPLOY.md">Deploy yours</a>
  </div>
</header>

<div class="plats">
  <p class="plats-label">Publishes to</p>
  <div class="logo-row">
    <img src="https://cdn.simpleicons.org/devdotto/e8e9ea" alt="dev.to" height="20">
    <img src="https://cdn.simpleicons.org/hashnode/e8e9ea" alt="Hashnode" height="20">
    <img src="https://cdn.simpleicons.org/medium/e8e9ea" alt="Medium" height="20">
    <img src="https://cdn.simpleicons.org/ghost/e8e9ea" alt="Ghost" height="20">
    <img src="https://cdn.simpleicons.org/wordpress/e8e9ea" alt="WordPress" height="20">
    <img src="https://cdn.simpleicons.org/substack/e8e9ea" alt="Substack" height="20">
    <img src="https://cdn.simpleicons.org/github/e8e9ea" alt="GitHub Pages" height="20">
  </div>
</div>

<section>
  <h2>Three commands</h2>
  <p class="sec-sub">Clone, set one secret, deploy. Your instance is live on the edge in under two minutes.</p>
  <div class="term">
<span class="c"># deploy your own</span>
git clone https://github.com/princepal9120/openpost && cd openpost
npx wrangler secret put ADMIN_KEY
npx wrangler deploy

<span class="c"># publish to everything</span>
openpost login --url https://openpost.you.workers.dev --key &lt;key&gt;
openpost publish post.md --to devto,hashnode,ghost <span class="g"># done</span>
  </div>
</section>

<section>
  <h2>Built for agents and humans</h2>
  <p class="sec-sub">Use it from Claude Code, Cursor, your terminal, or the dashboard. Same pipeline underneath.</p>
  <div class="bento">
    <div class="cell wide"><h3>MCP server</h3><p>Streamable HTTP endpoint with 13 tools. Claude Code publishes your draft while you keep writing.</p><p class="mono">POST /mcp</p></div>
    <div class="cell wide"><h3>openpost-cli</h3><p>npm package for terminal publishing. Draft, publish, preview, retry, generate covers, build a static docs site.</p><p class="mono">openpost publish post.md</p></div>
    <div class="cell"><h3>Idempotent</h3><p>UNIQUE(draft_id, platform) in D1. Re-runs never double-post.</p></div>
    <div class="cell"><h3>Canonical wiring</h3><p>First success URL becomes the canonical link for every platform after it.</p></div>
    <div class="cell"><h3>Queue retries</h3><p>Cloudflare Queues fan out publishes. Failed platforms retry without touching the rest.</p></div>
    <div class="cell wide"><h3>AI cover images</h3><p>Workers AI generates a cover per draft and re-uploads it to each platform's media endpoint.</p><p class="mono">openpost cover "minimal desk setup"</p></div>
    <div class="cell"><h3>Zero cost</h3><p>D1 + KV + R2 + Queues all inside the free tier. Your credentials never leave your account.</p></div>
    <div class="cell"><h3>MIT licensed</h3><p>Fork it, extend it, add a platform adapter in ~60 lines.</p></div>
  </div>
</section>

<section>
  <h2>How a publish runs</h2>
  <p class="sec-sub">The pipeline underneath every surface.</p>
  <div class="steps">
    <div class="step"><span class="n">01</span><h3>Draft stored</h3><p>Markdown lands in D1 with its target platforms. Frontmatter tags extracted.</p></div>
    <div class="step"><span class="n">02</span><h3>Queue fans out</h3><p>One message per platform. Each adapter formats for its API and authenticates from stored creds.</p></div>
    <div class="step"><span class="n">03</span><h3>Canonical links</h3><p>First live URL becomes canonical for the rest. Every platform cross-links back to the origin.</p></div>
  </div>
</section>

<footer>
  <span>MIT License. Self-hosted. Your keys, your data.</span>
  <span><a href="https://github.com/princepal9120/openpost">GitHub</a> &nbsp;·&nbsp; <a href="/dashboard">Dashboard</a> &nbsp;·&nbsp; <a href="/api/status">API</a></span>
</footer>
</div>
</body>
</html>`
}
