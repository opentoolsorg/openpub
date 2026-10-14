#!/usr/bin/env bash
set -euo pipefail

normalize_boolean() {
  local name="$1"
  local value="$2"

  case "$value" in
    true|TRUE|True)
      printf 'true'
      ;;
    false|FALSE|False)
      printf 'false'
      ;;
    *)
      echo "::error::$name must be either true or false."
      exit 1
      ;;
  esac
}

posts_pathspec="${INPUT_POSTS:-:(glob)posts/**/*.md}"
changed_only="$(normalize_boolean changed-only "${INPUT_CHANGED_ONLY:-true}")"
dry_run="$(normalize_boolean dry-run "${INPUT_DRY_RUN:-false}")"
cli_version="${INPUT_CLI_VERSION:-0.1.0}"
platforms="${INPUT_PLATFORMS:-}"
status="${INPUT_STATUS:-}"
canonical="${INPUT_CANONICAL:-}"
config_json="${INPUT_CONFIG:-}"

if [[ ! "$cli_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
  echo "::error::cli-version must be an exact semantic version, for example 0.1.0."
  exit 1
fi

if [[ -n "$status" && "$status" != "draft" && "$status" != "published" ]]; then
  echo "::error::status must be either draft or published."
  exit 1
fi

# Materialise credentials. A config input wins; otherwise use the runner's
# existing ~/.openpub/config.json if the workflow already wrote one.
if [[ -n "$config_json" ]]; then
  mkdir -p "$HOME/.openpub"
  printf '%s' "$config_json" > "$HOME/.openpub/config.json"
  chmod 600 "$HOME/.openpub/config.json"
fi

if [[ "$dry_run" != "true" && ! -f "$HOME/.openpub/config.json" ]]; then
  echo "::error::No credentials found. Pass the 'config' input from a secret, or run with dry-run: true."
  exit 1
fi

if ! git_root="$(git rev-parse --show-toplevel 2>/dev/null)"; then
  echo "::error::The workspace is not a Git repository. Run actions/checkout before this action."
  exit 1
fi
cd "$git_root"

before_sha="${BEFORE_SHA:-}"
after_sha="${AFTER_SHA:-HEAD}"
declare -a files=()

if [[ "$changed_only" == "false" ]] ||
  [[ -z "$before_sha" ]] ||
  [[ "$before_sha" =~ ^0+$ ]] ||
  ! git cat-file -e "${before_sha}^{commit}" 2>/dev/null; then
  while IFS= read -r -d '' file; do
    files+=("$file")
  done < <(git ls-files -z -- "$posts_pathspec")
else
  while IFS= read -r -d '' file; do
    files+=("$file")
  done < <(
    git diff --name-only -z --diff-filter=ACMR \
      "$before_sha" "$after_sha" -- "$posts_pathspec"
  )
fi

if (( ${#files[@]} == 0 )); then
  echo "No Markdown articles matched $posts_pathspec."
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "published-count=0" >> "$GITHUB_OUTPUT"
  fi
  exit 0
fi

npx_bin="${OPENPUB_ACTION_NPX_BIN:-npx}"
if ! command -v "$npx_bin" >/dev/null 2>&1; then
  echo "::error::npx is unavailable. Ensure Node.js 20 or newer is installed."
  exit 1
fi

processed_count=0
for file in "${files[@]}"; do
  if [[ ! -f "$file" ]]; then
    continue
  fi

  echo "Publishing $file with openpub-cli@$cli_version..."
  command_args=(--yes "openpub-cli@$cli_version" publish "$file")

  if [[ -n "$platforms" ]]; then
    command_args+=(--to "$platforms")
  fi
  if [[ -n "$status" ]]; then
    command_args+=(--status "$status")
  fi
  if [[ -n "$canonical" ]]; then
    command_args+=(--canonical "$canonical")
  fi
  if [[ "$dry_run" == "true" ]]; then
    command_args+=(--dry-run)
  fi

  "$npx_bin" "${command_args[@]}"
  processed_count=$((processed_count + 1))
done

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "published-count=$processed_count" >> "$GITHUB_OUTPUT"
fi

echo "Successfully processed $processed_count Markdown article(s)."
