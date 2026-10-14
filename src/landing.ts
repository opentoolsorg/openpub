const css = `:root{--bg:#0c0d0e;--card:#131416;--line:#242628;--txt:#e9eaec;--mut:#8b8e93;--acc:#34d399;--mono:ui-monospace,'SF Mono',Menlo,monospace}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui,-apple-system,sans-serif;background:var(--bg);color:var(--txt);line-height:1.65}
a{color:var(--txt);text-decoration:none}
.wrap{max-width:46rem;margin:0 auto;padding:0 1.25rem}
nav{display:flex;align-items:center;justify-content:space-between;height:60px;border-bottom:1px solid var(--line);font-size:.85rem}
.logo{font-family:var(--mono);font-size:1rem}.logo b{color:var(--acc)}
.nav-links{display:flex;gap:1.25rem;color:var(--mut)}.nav-links a:hover{color:var(--txt)}
.btn{display:inline-block;padding:.55rem 1.1rem;border-radius:.5rem;font-size:.88rem;font-weight:500;border:1px solid var(--line);transition:border-color .15s}
.btn:hover{border-color:var(--mut)}
.btn.pri{background:var(--acc);color:#052e1f;border-color:var(--acc);font-weight:600}.btn.pri:hover{filter:brightness(1.1)}
.hero{padding:4.5rem 0 3rem}
.eyebrow{font-family:var(--mono);font-size:.7rem;letter-spacing:.15em;color:var(--acc);text-transform:uppercase;margin-bottom:1rem}
h1{font-size:clamp(2.1rem,5vw,3.1rem);line-height:1.1;font-weight:640;letter-spacing:-.02em;max-width:15ch}
.sub{color:var(--mut);font-size:1.02rem;max-width:50ch;margin-top:1rem}
.cta{display:flex;gap:.65rem;margin-top:1.75rem;flex-wrap:wrap}
.plats{padding:1.75rem 0;border-top:1px solid var(--line);font-size:.78rem;color:var(--mut)}
.plats .row{display:flex;gap:1.6rem;align-items:center;margin-top:.9rem;flex-wrap:wrap}
.plats img{height:18px;opacity:.7;filter:grayscale(1) brightness(1.5)}
.plats img:hover{opacity:1}
section{padding:3rem 0;border-top:1px solid var(--line)}
h2{font-size:1.35rem;font-weight:600;margin-bottom:.4rem}
.lead{color:var(--mut);font-size:.92rem;max-width:56ch;margin-bottom:1.75rem}
.steps{display:grid;gap:1.4rem}
.step{display:flex;gap:1rem}
.step .num{font-family:var(--mono);color:var(--acc);font-size:.85rem;flex-shrink:0;padding-top:.1rem}
.step h3{font-size:.95rem;font-weight:600}
.step p{font-size:.85rem;color:var(--mut);margin-top:.2rem}
.term{background:#0a0b0c;border:1px solid var(--line);border-radius:.6rem;padding:1rem 1.25rem;font-family:var(--mono);font-size:.8rem;line-height:1.85;overflow-x:auto;margin-top:1rem}
.term .c{color:var(--mut)}.term .g{color:var(--acc)}
.feat{border-top:1px solid var(--line);padding:1rem 0;display:flex;gap:1rem;align-items:baseline}
.feat h3{font-size:.9rem;font-weight:600;flex-shrink:0;width:10rem}
.feat p{font-size:.83rem;color:var(--mut)}
code.ic{font-family:var(--mono);font-size:.8em;color:var(--acc);background:var(--card);padding:.1em .4em;border-radius:.3rem}
footer{border-top:1px solid var(--line);padding:1.75rem 0;font-size:.8rem;color:var(--mut);display:flex;justify-content:space-between;flex-wrap:wrap;gap:.75rem}
footer a{color:var(--mut)}footer a:hover{color:var(--txt)}
@media(max-width:640px){.feat{flex-direction:column;gap:.15rem}.feat h3{width:auto}}`

const nav = `<nav>
  <a class="logo" href="/">open<b>post</b></a>
  <div class="nav-links"><a href="/docs">Docs</a><a href="https://github.com/princepal9120/openpost">GitHub</a><a href="/dashboard">Dashboard</a></div>
</nav>`

const foot = `<footer>
  <span>MIT. Self-hosted. Your keys, your data.</span>
  <span><a href="/docs">Docs</a> &nbsp;<a href="/dashboard">Dashboard</a> &nbsp;<a href="https://github.com/princepal9120/openpost">GitHub</a></span>
</footer>`

export function landingHtml(): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenPost - write once, publish everywhere</title>
<meta name="description" content="Self-hosted cross-publisher for blogs on Cloudflare. One markdown file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, X Articles, and your own site.">
<style>${css}</style></head><body><div class="wrap">
${nav}
<header class="hero">
  <div class="eyebrow">Self-hosted on Cloudflare free tier</div>
  <h1>Your blog, everywhere it matters.</h1>
  <p class="sub">One markdown file to dev.to, Hashnode, WordPress, Ghost, Medium, Substack, X Articles, and your own site. No subscription. Your keys never leave your account.</p>
  <div class="cta">
    <a class="btn pri" href="https://deploy.workers.cloudflare.com/?url=https://github.com/princepal9120/openpost">Deploy to Cloudflare</a>
    <a class="btn" href="https://github.com/princepal9120/openpost">Star on GitHub</a>
  </div>
</header>

<div class="plats">
  Publishes to
  <div class="row">
    <img src="https://cdn.simpleicons.org/devdotto/e9eaec" alt="dev.to" height="18">
    <img src="https://cdn.simpleicons.org/hashnode/e9eaec" alt="Hashnode" height="18">
    <img src="https://cdn.simpleicons.org/medium/e9eaec" alt="Medium" height="18">
    <img src="https://cdn.simpleicons.org/ghost/e9eaec" alt="Ghost" height="18">
    <img src="https://cdn.simpleicons.org/wordpress/e9eaec" alt="WordPress" height="18">
    <img src="https://cdn.simpleicons.org/substack/e9eaec" alt="Substack" height="18">
    <img src="https://cdn.simpleicons.org/x/e9eaec" alt="X Articles" height="18">
    <img src="https://cdn.simpleicons.org/github/e9eaec" alt="your site" height="18">
  </div>
</div>

<section>
  <h2>Three commands</h2>
  <p class="lead">Clone, set one secret, deploy. Running on the edge in under two minutes.</p>
  <div class="term"><span class="c"># deploy your own</span>
git clone https://github.com/princepal9120/openpost && cd openpost
npx wrangler secret put ADMIN_KEY
npx wrangler deploy

<span class="c"># publish to everything</span>
openpost login --url https://openpost.you.workers.dev --key &lt;key&gt;
openpost publish post.md --to devto,hashnode,x <span class="g"># done</span></div>
</section>

<section>
  <h2>Made for agents and humans</h2>
  <p class="lead">Same pipeline underneath every surface. Claude Code publishes your draft while you keep writing.</p>
  <div class="feat"><h3>MCP server</h3><p>Streamable HTTP, 13 tools. Claude Code, Cursor, Windsurf connect directly.</p></div>
  <div class="feat"><h3>openpost-cli</h3><p>Terminal publishing. Draft, publish, preview, retry, AI covers, docs generation.</p></div>
  <div class="feat"><h3>REST API</h3><p>Every operation over plain HTTP for scripts, Shortcuts, and CI.</p></div>
  <div class="feat"><h3>Idempotent</h3><p>Re-runs never double-post. One row per draft per platform.</p></div>
  <div class="feat"><h3>Canonical wiring</h3><p>First live URL becomes the canonical link for every platform after it.</p></div>
  <div class="feat"><h3>Queue retries</h3><p>Failed platforms retry without touching the ones that succeeded.</p></div>
  <div class="feat"><h3>Your website</h3><p>The github-pages adapter commits the post to your repo. Hugo, Astro, Jekyll, Next.js rebuild it.</p></div>
  <div class="feat"><h3>Zero cost</h3><p>D1 + KV + R2 + Queues inside the free tier. MIT licensed.</p></div>
</section>

${foot}
</div></body></html>`
}

export function docsHtml(): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OpenPost docs</title>
<style>${css}
.docnav{display:flex;gap:.4rem;margin:1.5rem 0;flex-wrap:wrap}
.docnav a{font-size:.8rem;padding:.3rem .8rem;border:1px solid var(--line);border-radius:1rem;color:var(--mut)}
.docnav a:hover{color:var(--txt);border-color:var(--mut)}
section{padding:2rem 0}
h2{font-size:1.2rem}
table{width:100%;border-collapse:collapse;font-size:.82rem;margin-top:.5rem}
td,th{padding:.5rem .6rem;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
td:first-child{font-family:var(--mono);font-size:.78rem;color:var(--acc);white-space:nowrap}
pre{background:#0a0b0c;border:1px solid var(--line);border-radius:.5rem;padding:.9rem 1.1rem;font-family:var(--mono);font-size:.78rem;line-height:1.8;overflow-x:auto;margin:.75rem 0}
</style></head><body><div class="wrap">
${nav.replace('/docs">', '/">').replace('<a href="/">Home</a>', '').replace('<a href="/">Docs</a>', '<a href="/">Home</a>')}
<div class="docnav">
  <a href="#deploy">Deploy</a><a href="#platforms">Platforms</a><a href="#cli">CLI</a><a href="#mcp">MCP</a><a href="#api">API</a>
</div>

<section id="deploy">
  <h2>Deploy</h2>
  <div class="steps">
    <div class="step"><span class="num">1</span><div><h3>Clone + create resources</h3>
      <pre>git clone https://github.com/princepal9120/openpost
cd openpost && npm install
cf d1 create --name openpost-db
cf kv namespaces create --title openpost-keys
cf r2 buckets create-by-name openpost-media
cf queues create --queue-name openpost-publish
cf d1 query &lt;db-id&gt; --sql "$(cat migrations/init.sql)"</pre>
      <p>Copy the returned ids into <code class="ic">wrangler.toml</code>.</p></div></div>
    <div class="step"><span class="num">2</span><div><h3>Set the admin key + deploy</h3>
      <pre>npx wrangler secret put ADMIN_KEY
npx wrangler deploy</pre>
      <p>One secret protects every surface: API, MCP, dashboard login.</p></div></div>
    <div class="step"><span class="num">3</span><div><h3>Add a platform, publish</h3>
      <pre>openpost login --url https://openpost.you.workers.dev --key &lt;ADMIN_KEY&gt;
openpost setup devto '{"api_key": "..."}'
openpost publish post.md --to devto,hashnode,x</pre>
      <p>Or paste creds in the dashboard's Setup modal, or call the MCP <code class="ic">setup</code> tool from Claude Code.</p></div></div>
  </div>
</section>

<section id="platforms">
  <h2>Platform credentials</h2>
  <p class="lead">Each platform stores one JSON blob. Dashboard Setup accepts the same shape.</p>
  <table>
    <tr><th>platform</th><th>credentials</th><th>where to get them</th></tr>
    <tr><td>devto</td><td>api_key</td><td>dev.to Settings &gt; Extensions &gt; API keys</td></tr>
    <tr><td>hashnode</td><td>token, publication_id</td><td>Hashnode &gt; Developer settings &gt; PAT. publication_id auto-resolves if blank.</td></tr>
    <tr><td>wordpress</td><td>site_url, username, app_password</td><td>WP admin &gt; Users &gt; Application Passwords</td></tr>
    <tr><td>ghost</td><td>site_url, admin_key</td><td>Ghost &gt; Integrations &gt; Admin API key (id:secret)</td></tr>
    <tr><td>medium</td><td>integration_token</td><td>medium.com &gt; Settings &gt; Security &gt; Integration tokens</td></tr>
    <tr><td>substack</td><td>publication_url, connect_sid</td><td>DevTools &gt; Application &gt; Cookies &gt; connect.sid. Publishes as draft.</td></tr>
    <tr><td>x</td><td>access_token</td><td>X developer app, OAuth2 user token, tweet.write scope. X Premium required.</td></tr>
    <tr><td>github-pages</td><td>token, repo, dir?, branch?</td><td>GitHub PAT with repo scope. dir defaults to content/posts.</td></tr>
  </table>
</section>

<section id="cli">
  <h2>CLI</h2>
  <pre>npm i -g openpost-cli
openpost login --url &lt;worker&gt; --key &lt;key&gt;
openpost setup &lt;platform&gt; '{"k":"v"}'
openpost test &lt;platform&gt;
openpost draft post.md --to devto,hashnode
openpost publish post.md --to devto,hashnode,x,github-pages
openpost preview post.md
openpost cover "minimal desk setup"
openpost retry &lt;draftId&gt; &lt;platform&gt;
openpost docs ./posts        # markdown to static site
openpost drafts | status | history</pre>
</section>

<section id="mcp">
  <h2>MCP</h2>
  <p class="lead">Any MCP client (Claude Code, Cursor, Windsurf) gets 13 tools over Streamable HTTP.</p>
  <pre>claude mcp add openpost --transport http \\
  https://openpost.you.workers.dev/mcp \\
  --header "Authorization: Bearer &lt;ADMIN_KEY&gt;"</pre>
  <p>Tools: publish, cross_publish, save_draft, list_drafts, get_draft, delete_draft, setup, status, test_platform, generate_cover, list_posts, check_links, frontmatter.</p>
</section>

<section id="api">
  <h2>API</h2>
  <table>
    <tr><th>endpoint</th><th>what it does</th></tr>
    <tr><td>GET /api/status</td><td>configured + available platforms</td></tr>
    <tr><td>POST /api/platforms/:name</td><td>store creds JSON</td></tr>
    <tr><td>POST /api/platforms/:name/test</td><td>test creds</td></tr>
    <tr><td>GET /api/drafts</td><td>list drafts</td></tr>
    <tr><td>POST /api/drafts</td><td>save draft {title, content, platforms[]}</td></tr>
    <tr><td>GET /api/drafts/:id/preview</td><td>rendered HTML + frontmatter</td></tr>
    <tr><td>POST /api/publish</td><td>{draftId} or {content, platforms[]}</td></tr>
    <tr><td>GET /api/posts</td><td>per-draft publish matrix</td></tr>
    <tr><td>GET /api/history</td><td>publish log</td></tr>
    <tr><td>POST /api/history/:draft/:platform/retry</td><td>retry one platform</td></tr>
    <tr><td>POST /api/images/generate</td><td>AI cover {prompt, draftId?}</td></tr>
  </table>
  <p>Auth everywhere: <code class="ic">Authorization: Bearer &lt;ADMIN_KEY&gt;</code> or <code class="ic">?key=</code>.</p>
</section>

${foot}
</div></body></html>`
}
