import assert from 'node:assert/strict'
import { lstatSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const html = readFileSync(new URL('../.output/public/index.html', import.meta.url), 'utf8')
const docs = readFileSync(new URL('../.output/public/docs/index.html', import.meta.url), 'utf8')

test('prerender includes accessible setup controls and safe source-build commands', () => {
  assert.equal((html.match(/role="tab"/g) || []).length, 9)
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1)
  assert.equal((html.match(/aria-controls="setup-panel"/g) || []).length, 9)
  assert.match(html, /role="tabpanel"[^>]*id="setup-panel"|id="setup-panel"[^>]*role="tabpanel"/)
  assert.equal((html.match(/aria-label="Copy /g) || []).length, 3)
  assert.match(html, /npm run mcp:build/)
  assert.match(html, /apps\/mcp\/dist\/index.js/)
  assert.doesNotMatch(html, /GitHub Action|uses: princepal9120|npx openpub-/)
})

test('prerender publishes docs content, anchors and correct destinations', () => {
  for (const text of ['Getting started with OpenPub', 'CLI Reference', 'MCP Setup', 'Platforms Table', 'Architecture &amp; API']) assert.ok(docs.includes(text), text)
  for (const id of ['getting-started', 'cli', 'mcp', 'platforms', 'architecture', 'arch-api-matrix']) assert.ok(docs.includes(`id=\"${id}\"`), id)
  assert.doesNotMatch(docs, /Open <\/span>Dashboard|href="[^"]*\/app"/)
  assert.doesNotMatch(docs, /href=\"\/app\"/)
  assert.match(html, /href=\"\/docs\"/)
})

test('mobile docs retain reachable sections and keyboard-scrollable references', () => {
  assert.match(docs, /id="docs-menu-toggle"/)
  assert.match(docs, /aria-controls="mobile-docs-nav"/)
  assert.match(docs, /aria-current="location"/)
  const regions = docs.match(/<div\b[^>]*role="region"[^>]*>/g) || []
  assert.equal(regions.length, 8)
  for (const region of regions) {
    assert.match(region, /tabindex="0"/)
    assert.match(region, /aria-label(?:ledby)?="[^"]+"/)
    assert.match(region, /overflow-x-auto/)
  }
  const tables = docs.match(/<table\b[^>]*>/g) || []
  assert.equal(tables.length, 7)
  assert.equal(tables.filter(table => table.includes('min-w-[600px]')).length, 6)
  assert.equal(tables.filter(table => table.includes('min-w-[800px]')).length, 1)
  assert.match(docs, /<pre class="w-max min-w-full">/)
})

test('agent setup guide ships unchanged with site and dashboard assets', () => {
  const guide = readFileSync(new URL('../public/llms.txt', import.meta.url), 'utf8')
  // Separate deployments need plain copies; symlinks can retain checkout-only paths.
  for (const path of ['../.output/public/llms.txt', '../../dashboard/public/llms.txt', '../../dashboard/.output/public/llms.txt']) {
    const file = new URL(path, import.meta.url)
    assert.equal(lstatSync(file).isSymbolicLink(), false, path)
    assert.equal(readFileSync(file, 'utf8'), guide, path)
  }
  assert.ok(docs.includes('id="agent-setup"'))
  assert.ok(docs.includes('href="https://openpub.princepal.dev/llms.txt"'))
  assert.ok(docs.includes('Agent setup prompt'))
  assert.ok(docs.includes('stop for my approval before any platform write'))
  assert.match(guide, /npm run cli:build/)
  assert.match(guide, /npm run mcp:build/)
  assert.match(guide, /--status draft --dry-run/)
  assert.match(guide, /Remote publish\/cross_publish can publish live immediately/)
  assert.doesNotMatch(guide, /npx openpub-|npm install -g openpub/)
})

test('prerender retains platform limits, theme bootstrap and current landing content', () => {
  for (const text of ['Medium', 'Substack', 'X Articles', 'Your Pages', 'Draft only', 'Create only', 'approving any platform write']) assert.ok(html.includes(text), text)
  assert.equal((html.match(/<article class="bn(?: bn-featured)?"/g) || []).length, 6)
  assert.equal((html.match(/<article class="bn bn-featured"/g) || []).length, 2)
  assert.doesNotMatch(html, /<section[^>]*(?:id="preview"|class="[^"]*preview)/i)
  assert.ok(html.includes('node apps/cli/dist/index.js publish post.md --to devto,hashnode --status draft --dry-run'))
  assert.ok(html.includes('href="https://openpub.princepal.dev/llms.txt"'))
  assert.ok(html.includes("localStorage.getItem('op-theme')"))
  assert.ok(html.includes('prefers-color-scheme: light'))
  assert.ok(html.includes('Skip to content'))
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1)
})
