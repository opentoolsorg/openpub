# Graph Report - .  (2026-10-14)

## Corpus Check
- 20 files · ~12,634 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 76 nodes · 116 edges · 10 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `die()` - 6 edges
2. `tagsFor()` - 5 edges
3. `readMd()` - 4 edges
4. `draftOrPublish()` - 4 edges
5. `mcpHandler()` - 4 edges
6. `call()` - 3 edges
7. `help()` - 3 edges
8. `publishConsumer()` - 3 edges
9. `need()` - 2 edges
10. `parseFrontmatter()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (0): 

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (0): 

### Community 2 - "Community 2"
Cohesion: 0.27
Nodes (8): call(), die(), draftOrPublish(), globalHelp(), help(), need(), parseFrontmatter(), readMd()

### Community 3 - "Community 3"
Cohesion: 0.33
Nodes (6): callTool(), err(), mcpHandler(), ok(), makeEnv(), mockDB()

### Community 4 - "Community 4"
Cohesion: 0.48
Nodes (5): batch(), fakeD1(), makeEnv(), seed(), tagsFor()

### Community 5 - "Community 5"
Cohesion: 0.6
Nodes (3): extractTags(), publishConsumer(), rid()

### Community 6 - "Community 6"
Cohesion: 0.67
Nodes (2): base64url(), ghostJwt()

### Community 7 - "Community 7"
Cohesion: 0.67
Nodes (2): base(), cookieUserId()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (2): input(), tagsSent()

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): gql(), publicationId()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._