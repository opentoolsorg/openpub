# Graph Report - .  (2026-10-25)

## Corpus Check
- 66 files · ~69,319 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 228 nodes · 361 edges · 17 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `callTool()` - 11 edges
2. `loadConfig()` - 6 edges
3. `publishConsumer()` - 6 edges
4. `tagsFor()` - 5 edges
5. `saveConfig()` - 5 edges
6. `mcpHandler()` - 5 edges
7. `openpubHome()` - 4 edges
8. `configPath()` - 4 edges
9. `setCreds()` - 4 edges
10. `parseFrontmatter()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (5): input(), tagsSent(), UpdateUnsupportedError, base(), cookieUserId()

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (8): advance(), BOLD(), clearTimer(), die(), DIM(), onMotionChange(), RED(), usage()

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (2): handleHash(), resolveSectionFromHash()

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (10): enqueuePublish(), extractTags(), firstHeading(), permanent(), publishConsumer(), publishFile(), refreshDraftStatus(), resolvePlatforms() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (4): extractTitle(), getDomainFromUrl(), handleTestAndConnect(), parseFrontmatterAndContent()

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (2): getDraft(), updateDraft()

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (10): asPlatforms(), parseFrontmatter(), parseList(), unquote(), fields(), gql(), publicationId(), tags() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (3): escapeHtml(), html(), renderPreviewPage()

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (2): base64url(), ghostJwt()

### Community 9 - "Community 9"
Cohesion: 0.28
Nodes (11): asFormat(), asPlatform(), assertKnown(), auditFile(), callTool(), checkLinks(), frontmatterFields(), optionalBool() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.36
Nodes (11): configPath(), configuredPlatforms(), getCreds(), loadConfig(), openpubHome(), removeCreds(), saveConfig(), setCreds() (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.31
Nodes (7): callTool(), err(), keyEq(), mcpHandler(), ok(), makeEnv(), mockDB()

### Community 12 - "Community 12"
Cohesion: 0.48
Nodes (5): batch(), fakeD1(), makeEnv(), seed(), tagsFor()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (2): navigate(), pick()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (0):

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (0):

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0):

## Knowledge Gaps
- **Thin community `Community 15`** (1 nodes): `node.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._