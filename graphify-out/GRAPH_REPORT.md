# Graph Report - .  (2026-10-25)

## Corpus Check
- 62 files · ~55,566 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 214 nodes · 340 edges · 15 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `callTool()` - 11 edges
2. `publishConsumer()` - 6 edges
3. `loadConfig()` - 6 edges
4. `tagsFor()` - 5 edges
5. `mcpHandler()` - 5 edges
6. `saveConfig()` - 5 edges
7. `openpubHome()` - 4 edges
8. `configPath()` - 4 edges
9. `setCreds()` - 4 edges
10. `parseFrontmatter()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (5): input(), tagsSent(), UpdateUnsupportedError, base(), cookieUserId()

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (9): asPlatforms(), parseFrontmatter(), parseList(), unquote(), escapeHtml(), html(), renderPreviewPage(), shortHash() (+1 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (2): handleHash(), resolveSectionFromHash()

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (4): extractTitle(), getDomainFromUrl(), handleTestAndConnect(), parseFrontmatterAndContent()

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (8): advance(), BOLD(), clearTimer(), die(), DIM(), onMotionChange(), RED(), usage()

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (11): asFormat(), asPlatform(), assertKnown(), auditFile(), callTool(), checkLinks(), frontmatterFields(), optionalBool() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (2): getDraft(), updateDraft()

### Community 7 - "Community 7"
Cohesion: 0.21
Nodes (10): enqueuePublish(), extractTags(), firstHeading(), permanent(), publishConsumer(), publishFile(), refreshDraftStatus(), resolvePlatforms() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.14
Nodes (2): base64url(), ghostJwt()

### Community 9 - "Community 9"
Cohesion: 0.36
Nodes (11): configPath(), configuredPlatforms(), getCreds(), loadConfig(), openpubHome(), removeCreds(), saveConfig(), setCreds() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.31
Nodes (7): callTool(), err(), keyEq(), mcpHandler(), ok(), makeEnv(), mockDB()

### Community 11 - "Community 11"
Cohesion: 0.48
Nodes (5): batch(), fakeD1(), makeEnv(), seed(), tagsFor()

### Community 12 - "Community 12"
Cohesion: 0.47
Nodes (4): fields(), gql(), publicationId(), tags()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 14`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 6` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._