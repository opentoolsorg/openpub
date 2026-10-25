import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { BrandIcon } from './Brand'

const serverPath = '/absolute/path/to/openpub/apps/mcp/dist/index.js'
const server = { command: 'node', args: [serverPath] }
const json = (value: unknown) => JSON.stringify(value, null, 2)
const clients = [
  { id: 'claude', name: 'Claude Code', logo: 'claude-code', file: '.mcp.json', code: json({ mcpServers: { openpub: server } }) },
  { id: 'codex', name: 'Codex', logo: 'codex', file: '~/.codex/config.toml', code: `[mcp_servers.openpub]\ncommand = "node"\nargs = ["${serverPath}"]` },
  { id: 'cursor', name: 'Cursor', logo: 'cursor', file: '.cursor/mcp.json', code: json({ mcpServers: { openpub: { type: 'stdio', ...server } } }) },
  { id: 'copilot', name: 'GitHub Copilot', logo: 'copilot', file: '.vscode/mcp.json', code: json({ servers: { openpub: { type: 'stdio', ...server } } }) },
  { id: 'hermes', name: 'Hermes Agent', logo: 'hermes', file: '~/.hermes/config.yaml', code: `mcp_servers:\n  openpub:\n    command: node\n    args: ["${serverPath}"]` },
  { id: 'opencode', name: 'OpenCode', logo: 'opencode', file: 'opencode.json', code: json({ $schema: 'https://opencode.ai/config.json', mcp: { openpub: { type: 'local', command: ['node', serverPath], enabled: true } } }) },
  { id: 'openclaw', name: 'OpenClaw', logo: 'openclaw', file: 'your MCP client configuration', code: json({ mcpServers: { openpub: server } }) },
  { id: 'grok', name: 'Grok Bot', logo: 'grok', file: '', code: '' },
  { id: 'cli', name: 'CLI', logo: '', file: '', code: '' },
]

export const agents = clients.filter(client => client.id !== 'cli')

function CodeBlock({ text, label, onInteract }: { text: string; label: string; onInteract: () => void }) {
  const [status, setStatus] = useState('')
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  async function copy() {
    onInteract()
    try {
      await navigator.clipboard.writeText(text)
      if (mounted.current) setStatus('Copied')
    } catch {
      if (mounted.current) setStatus('Copy failed. Select the text and copy it manually.')
    }
  }
  return <div className="code-wrap"><button className="copy" type="button" onClick={copy} aria-label={`Copy ${label}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg></button><pre><code>{text}</code></pre><span className={status ? 'copy-status' : 'sr-only'} role="status">{status}</span></div>
}

export function Setup() {
  const [selected, setSelected] = useState(0)
  const [cycling, setCycling] = useState(true)
  const [held, setHeld] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  useEffect(() => {
    if (!cycling || held || reducedMotion) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setSelected(index => (index + 1) % clients.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [cycling, held, reducedMotion])
  function pick(index: number) { setCycling(false); setSelected(index) }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next: number
    if (event.key === 'ArrowRight') next = (index + 1) % clients.length
    else if (event.key === 'ArrowLeft') next = (index + clients.length - 1) % clients.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = clients.length - 1
    else return
    event.preventDefault()
    pick(next)
    tabs.current[next]?.focus()
  }
  const client = clients[selected]
  const steps = client.id === 'cli' ? [
    { title: 'Build the CLI', lead: 'Build from source. Run these commands from your terminal.', code: 'git clone https://github.com/princepal9120/openpub\ncd openpub\nnpm install\nnpm run cli:build' },
    { title: 'Store a platform key', lead: 'Keys stay in ~/.openpub/config.json. Status checks the connection.', code: 'node apps/cli/dist/index.js setup devto \'{"api_key":"YOUR_DEVTO_KEY"}\'\nnode apps/cli/dist/index.js status' },
    { title: 'Dry-run a post', lead: 'Nothing is sent. Replace --dry-run with --status draft to create a draft.', code: 'node apps/cli/dist/index.js publish post.md --to devto --dry-run' },
  ] : [
    { title: 'Build the server', lead: 'Build from the repo once. No hosted service or account needed.', code: 'git clone https://github.com/princepal9120/openpub\ncd openpub\nnpm install\nnpm run mcp:build' },
    { title: `Add it to ${client.name}`, lead: `Merge this into ${client.file}. Replace the absolute path with your own.${client.id === 'openclaw' ? ' Exact setup depends on your MCP integration.' : ''}`, code: client.code },
    { title: 'Restart and ask', lead: 'Restart your client. It can store a key, check links, dry-run and publish. Drafts stay the default.', code: 'Check the links in post.md, then do a dry run to dev.to and Hashnode.' },
  ]
  return <section className="setup" aria-label="Set up OpenPub" onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocusCapture={() => setHeld(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false) }}>
    <div className="setup-bar"><div className="tab-scroll"><div className="tab-rail" role="tablist" aria-label="Where you run OpenPub">{clients.map((item, index) => <button key={item.id} ref={node => { tabs.current[index] = node }} type="button" role="tab" id={`tab-${item.id}`} aria-controls="setup-panel" aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onKeyDown={event => navigate(event, index)} onClick={() => pick(index)}><span className="agent-glyph" aria-hidden="true">{item.logo ? <BrandIcon logo={item.logo} /> : '>_'}</span>{item.name}</button>)}</div></div><div className="setup-controls"><span>{client.id === 'cli' ? 'Terminal · Node 20+' : client.id === 'grok' ? 'Setup not verified' : 'Local stdio server · Node 20+'}</span><button type="button" className="cycle" aria-pressed={cycling && !reducedMotion} disabled={reducedMotion} onClick={() => setCycling(value => !value)}>{reducedMotion ? 'Auto-cycle off' : cycling ? 'Pause cycling' : 'Resume cycling'}</button></div></div>
    <div key={client.id} className="setup-panel" role="tabpanel" id="setup-panel" aria-labelledby={`tab-${client.id}`} tabIndex={0}>{client.id === 'grok' ? <div className="setup-unverified"><h2>OpenPub setup for Grok Bot hasn’t been verified.</h2><p>There is no verified OpenPub connection to copy yet. Use the CLI tab or one of the other MCP clients.</p><a href="https://docs.x.ai/grok-bot/computer-and-apps">How Connect apps works in Grok Bot →</a></div> : <div className="three-grid">{steps.map((step, index) => <div className="setup-step" key={step.title}><h2><span className="step-num">{index + 1}</span>{step.title}</h2><p>{step.lead}</p><CodeBlock text={step.code} label={`${step.title} commands`} onInteract={() => setCycling(false)} /></div>)}</div>}</div>
  </section>
}
