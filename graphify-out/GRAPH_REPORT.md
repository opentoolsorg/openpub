# Graph Report - .  (2026-10-14)

## Corpus Check
- 31 files · ~25,162 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 109 nodes · 162 edges · 12 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `die()` - 7 edges
2. `watchJobs()` - 7 edges
3. `draftOrPublish()` - 6 edges
4. `tagsFor()` - 5 edges
5. `call()` - 4 edges
6. `readMd()` - 4 edges
7. `publishConsumer()` - 4 edges
8. `mcpHandler()` - 4 edges
9. `ok()` - 3 edges
10. `promptOr()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (16): bad(), call(), die(), draftOrPublish(), globalHelp(), help(), need(), ok() (+8 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (2): gql(), publicationId()

### Community 2 - "Community 2"
Cohesion: 0.16
Nodes (0): 

### Community 3 - "Community 3"
Cohesion: 0.15
Nodes (0): 

### Community 4 - "Community 4"
Cohesion: 0.33
Nodes (6): callTool(), err(), mcpHandler(), ok(), makeEnv(), mockDB()

### Community 5 - "Community 5"
Cohesion: 0.48
Nodes (5): batch(), fakeD1(), makeEnv(), seed(), tagsFor()

### Community 6 - "Community 6"
Cohesion: 0.53
Nodes (4): extractTags(), publishConsumer(), refreshDraftStatus(), rid()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (2): base64url(), ghostJwt()

### Community 8 - "Community 8"
Cohesion: 0.67
Nodes (2): base(), cookieUserId()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): input(), tagsSent()

### Community 10 - "Community 10"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Community 11"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 11`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._