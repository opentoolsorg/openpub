#!/usr/bin/env bash
set -euo pipefail

action_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
fixture_root="$(mktemp -d)"
cleanup() {
  cd /
  rm -rf "$fixture_root"
}
trap cleanup EXIT

cd "$fixture_root"
git init -q
git config user.email "test@openpub.dev"
git config user.name "OpenPub Test"
mkdir -p posts/guides
printf '%s\n' '# First version' > posts/first.md
printf '%s\n' '# Existing guide' > posts/guides/existing.md
git add posts
git commit -qm "initial posts"
before_sha="$(git rev-parse HEAD)"

printf '%s\n' '# Updated version' > posts/first.md
printf '%s\n' '# New guide' > posts/guides/new.md
git add posts
git commit -qm "update posts"
after_sha="$(git rev-parse HEAD)"

export INPUT_POSTS=':(glob)posts/**/*.md'
export INPUT_CHANGED_ONLY=true
export INPUT_PLATFORMS=devto,hashnode
export INPUT_STATUS=draft
export INPUT_DRY_RUN=true
export INPUT_CLI_VERSION=0.1.0
export BEFORE_SHA="$before_sha"
export AFTER_SHA="$after_sha"
export OPENPUB_ACTION_NPX_BIN="$action_root/test/fake-npx.sh"
export FAKE_NPX_LOG="$fixture_root/npx.log"
export GITHUB_OUTPUT="$fixture_root/github-output"

"$action_root/scripts/publish.sh"

grep -Fq 'publish posts/first.md --to devto,hashnode --status draft --dry-run' "$FAKE_NPX_LOG"
grep -Fq 'publish posts/guides/new.md --to devto,hashnode --status draft --dry-run' "$FAKE_NPX_LOG"
if grep -Fq 'posts/guides/existing.md' "$FAKE_NPX_LOG"; then
  echo "Unchanged article was unexpectedly processed."
  exit 1
fi
grep -Fxq 'published-count=2' "$GITHUB_OUTPUT"

echo "Action publish test passed."
