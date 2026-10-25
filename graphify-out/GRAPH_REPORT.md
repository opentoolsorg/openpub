# Graph Report - /Users/princepal/Desktop/test/openpub  (2026-10-26)

## Corpus Check
- 77 files · ~71,140 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 258 nodes · 413 edges · 17 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `callTool()` - 11 edges
2. `loadConfig()` - 6 edges
3. `tagsFor()` - 5 edges
4. `saveConfig()` - 5 edges
5. `parsePost()` - 5 edges
6. `frontmatterFromParsed()` - 5 edges
7. `mcpHandler()` - 5 edges
8. `sha256()` - 5 edges
9. `openpubHome()` - 4 edges
10. `configPath()` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (0):

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (18): asFormat(), asPlatform(), assertKnown(), auditFile(), callTool(), checkLinks(), frontmatterFields(), optionalBool() (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (6): fields(), gql(), publicationId(), tags(), shortHash(), slugify()

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (11): advance(), BOLD(), clearTimer(), die(), DIM(), onMotionChange(), RED(), usage() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (4): getDraft(), refreshDraftStatus(), setDraftStatus(), updateDraft()

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (2): input(), tagsSent()

### Community 6 - "Community 6"
Cohesion: 0.22
Nodes (9): asPlatforms(), asStrings(), frontmatterFromParsed(), headingTitle(), parseFrontmatter(), parseList(), parsePost(), resolvePostMetadata() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.26
Nodes (9): adminKeyMatches(), bytesToHex(), cookieValue(), createSession(), derivePassword(), hasValidSession(), readCookie(), sha256() (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.36
Nodes (11): configPath(), configuredPlatforms(), getCreds(), loadConfig(), openpubHome(), removeCreds(), saveConfig(), setCreds() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (2): base64url(), ghostJwt()

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (7): callTool(), err(), keyEq(), mcpHandler(), ok(), makeEnv(), mockDB()

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (3): UpdateUnsupportedError, base(), cookieUserId()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (2): navigate(), pick()

### Community 13 - "Community 13"
Cohesion: 0.48
Nodes (5): batch(), fakeD1(), makeEnv(), seed(), tagsFor()

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
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
