export function dashboardHtml(): string {
  return `<!doctype html><html><head><meta charset="utf8"><title>OpenPost</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#fafafa;color:#111;max-width:56rem;margin:0 auto;padding:2rem 1rem}
h1{font-size:1.5rem;font-weight:600;margin-bottom:1.5rem;display:flex;align-items:center;gap:.5rem}
.tabs{display:flex;gap:.25rem;border-bottom:1px solid #e5e5e5;margin-bottom:1.5rem}
.tab{padding:.5rem 1rem;cursor:pointer;border:none;background:none;font-size:.9rem;color:#666;border-bottom:2px solid transparent}
.tab.active{color:#111;border-bottom-color:#111;font-weight:500}
.card{background:#fff;border:1px solid #e5e5e5;border-radius:.5rem;padding:1rem;margin-bottom:.75rem}
.card h3{font-size:.95rem;font-weight:600}
.card p{font-size:.8rem;color:#666;margin-top:.25rem}
.badge{display:inline-block;font-size:.7rem;padding:.15rem .5rem;border-radius:1rem;margin:.1rem .2rem 0 0}
.badge.ok{background:#dcfce7;color:#166534}.badge.err{background:#fee2e2;color:#991b1b}.badge.off{background:#f5f5f5;color:#666}
input,textarea,select{font-size:.9rem;padding:.5rem .75rem;border:1px solid #ddd;border-radius:.375rem;width:100%;margin-bottom:.5rem;font-family:inherit}
textarea{min-height:6rem;resize:vertical;font-family:ui-monospace,monospace;font-size:.82rem}
button{background:#111;color:#fff;border:none;padding:.5rem 1rem;border-radius:.375rem;font-size:.85rem;cursor:pointer}
button:hover{background:#333}button.ghost{background:#f5f5f5;color:#333;border:1px solid #ddd}
.hidden{display:none}#status-bar{position:fixed;bottom:0;left:0;right:0;background:#111;color:#fff;padding:.75rem 1rem;font-size:.85rem;display:none;z-index:100}
.chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.75rem}
.chip{padding:.3rem .7rem;border:1px solid #ddd;border-radius:1rem;font-size:.8rem;cursor:pointer;user-select:none}
.chip.sel{background:#111;color:#fff;border-color:#111}
</style></head><body>
<h1>OpenPost <span style="font-weight:400;font-size:.85rem;color:#888">write once, publish everywhere</span></h1>
<div class="tabs">
  <button class="tab active" onclick="show('drafts')">Drafts</button>
  <button class="tab" onclick="show('platforms')">Platforms</button>
  <button class="tab" onclick="show('history')">History</button>
</div>
<div id="status-bar"></div>
<div id="drafts">
  <div class="card">
    <textarea id="md" placeholder="# Title\n\nMarkdown content..."></textarea>
    <div class="chips" id="plat-chips"></div>
    <button onclick="publish()">Publish</button>
    <button class="ghost" onclick="saveDraft()">Save Draft</button>
  </div>
  <div id="draft-list"></div>
</div>
<div id="platforms" class="hidden"><div id="plat-list"></div></div>
<div id="history" class="hidden"><div id="hist-list"></div></div>
<script>
const KEY=new URLSearchParams(location.search).get('key')||localStorage.getItem('op-key');
if(KEY)localStorage.setItem('op-key',KEY);
const api=(p,m,b)=>fetch('/api'+p,{method:m||'GET',headers:{'Content-Type':'application/json','Authorization':'Bearer '+KEY},body:b?JSON.stringify(b):undefined}).then(r=>r.json());
const toast=m=>{const s=document.getElementById('status-bar');s.textContent=m;s.style.display='block';setTimeout(()=>s.style.display='none',3e3)};
function show(t){document.querySelectorAll('.tab').forEach(e=>e.classList.remove('active'));event.target.classList.add('active');['drafts','platforms','history'].forEach(x=>document.getElementById(x).classList.add('hidden'));document.getElementById(t).classList.remove('hidden');if(t==='drafts')loadDrafts();if(t==='platforms')loadPlatforms();if(t==='history')loadHistory();}
const ALL=['devto','hashnode','wordpress','ghost','medium','substack','github-pages','x'];const sel=new Set();
function renderChips(){document.getElementById('plat-chips').innerHTML=ALL.map(p=>'<span class="chip'+(sel.has(p)?' sel':'')+'" onclick="tog(this.dataset.p)" data-p="'+p+'">'+p+'</span>').join('');}
function tog(p){sel.has(p)?sel.delete(p):sel.add(p);renderChips();}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=u=>/^https?:\/\//.test(u)?esc(u):'';
async function loadDrafts(){const d=await api('/drafts');document.getElementById('draft-list').innerHTML=(d.drafts||[]).map(x=>'<div class="card"><h3>'+esc(x.title||'Untitled')+'</h3><p>'+esc((x.platforms||[]).join(', '))+' — '+esc(x.status)+'</p><button class="ghost" onclick="pub(\\''+esc(x.id)+'\\')">Publish</button></div>').join('')||'<p style="color:#999">No drafts</p>';}
async function loadPlatforms(){const d=await api('/status');const cfg=(d.platforms||[]).map(x=>x.platform);document.getElementById('plat-list').innerHTML=ALL.map(p=>'<div class="card"><h3>'+esc(p)+'</h3><span class="badge '+(cfg.includes(p)?'ok':'off')+'">'+(cfg.includes(p)?'configured':'not configured')+'</span><button class="ghost" onclick="setupPlat(\\''+p+'\\')">Setup</button></div>').join('');}
async function loadHistory(){const d=await api('/history');document.getElementById('hist-list').innerHTML=(d.history||[]).map(x=>'<div class="card"><p>'+esc(x.draft_id.slice(0,8))+' → '+esc(x.platform)+'</p><span class="badge '+(x.status==='success'?'ok':'err')+'">'+esc(x.status)+'</span>'+(x.url?' <a href="'+safeUrl(x.url)+'" target="_blank" rel="noopener" style="font-size:.8rem">view</a>':'')+'</div>').join('')||'<p style="color:#999">No publishes yet</p>';}
async function saveDraft(){const md=document.getElementById('md').value;if(!md)return toast('write something first');const title=md.split('\\n').find(l=>l.startsWith('#'))?.replace('#','').trim();await api('/drafts','POST',{title,content:md,platforms:[...sel]});toast('draft saved');loadDrafts();}
async function publish(){const md=document.getElementById('md').value;if(!md||!sel.size)return toast('write + pick platforms');const title=md.split('\\n').find(l=>l.startsWith('#'))?.replace('#','').trim();const d=await api('/drafts','POST',{title,content:md,platforms:[...sel]});await api('/publish','POST',{draftId:d.id});toast('queued for publish');loadDrafts();}
async function pub(id){await api('/publish','POST',{draftId:id});toast('queued');}
async function setupPlat(p){const j=prompt('Paste credentials JSON for '+p+':');if(j)try{await api('/platforms/'+p,'POST',JSON.parse(j));toast('saved');loadPlatforms()}catch(e){toast('invalid JSON')}}
renderChips();loadDrafts();
</script></body></html>`
}
