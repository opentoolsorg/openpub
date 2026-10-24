import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const html = readFileSync(new URL('../.output/public/index.html', import.meta.url), 'utf8')

test('prerender includes accessible setup controls and safe source-build commands', () => {
  assert.equal((html.match(/role="tab"/g) || []).length, 9)
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1)
  assert.equal((html.match(/aria-controls="setup-panel"/g) || []).length, 9)
  assert.match(html, /role="tabpanel"[^>]*id="setup-panel"|id="setup-panel"[^>]*role="tabpanel"/)
  assert.equal((html.match(/aria-label="Copy /g) || []).length, 3)
  assert.match(html, /npm run build:mcp/)
  assert.match(html, /apps\/mcp\/dist\/index.js/)
  assert.doesNotMatch(html, /GitHub Action|uses: princepal9120|npx openpub-/)
})

test('prerender retains platform limits, theme bootstrap and sample-only preview', () => {
  for (const text of ['Medium', 'Substack', 'X Articles', 'GitHub Pages', 'Draft only', 'Create only', 'Sample content', 'Nothing goes live']) assert.ok(html.includes(text), text)
  assert.ok(html.includes("localStorage.getItem('op-theme')"))
  assert.ok(html.includes('prefers-color-scheme: light'))
  assert.ok(html.includes('Skip to content'))
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1)
})
