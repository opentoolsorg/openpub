import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const html = readFileSync(new URL('../.output/public/index.html', import.meta.url), 'utf8')
const docsHtml = readFileSync(new URL('../.output/public/docs/index.html', import.meta.url), 'utf8')

test('prerender serves documentation at /docs with Worker console links', () => {
  assert.match(docsHtml, /Documentation - OpenPub/)
  assert.match(docsHtml, /id="main"/)
  assert.match(docsHtml, /Getting Started/)
  assert.match(docsHtml, /CLI Reference/)
  for (const id of ['overview', 'two-modes', 'quickstart', 'cli', 'mcp-tools', 'platforms']) {
    assert.match(docsHtml, new RegExp(`href="#${id}"`), id)
  }
  assert.match(docsHtml, /https:\/\/openpub\.princslabs\.workers\.dev\/app/)
  assert.doesNotMatch(docsHtml, /href="\/app"/)
  assert.match(html, /href="\/docs"/)
})

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

test('prerender retains platform limits, theme bootstrap and current landing content', () => {
  for (const text of ['Medium', 'Substack', 'X Articles', 'GitHub Pages', 'Draft only', 'Create only', 'Nothing goes live']) assert.ok(html.includes(text), text)
  assert.equal((html.match(/<article class="bn(?: bn-featured)?"/g) || []).length, 6)
  assert.equal((html.match(/<article class="bn bn-featured"/g) || []).length, 2)
  assert.doesNotMatch(html, /<section[^>]*(?:id="preview"|class="[^"]*preview)/i)
  assert.ok(html.includes('node apps/cli/dist/index.js publish post.md --dry-run'))
  assert.ok(html.includes("localStorage.getItem('op-theme')"))
  assert.ok(html.includes('prefers-color-scheme: light'))
  assert.ok(html.includes('Skip to content'))
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1)
})
