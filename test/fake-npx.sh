#!/usr/bin/env bash
set -euo pipefail
: "${FAKE_NPX_LOG:?FAKE_NPX_LOG is required}"
printf '%s\n' "$*" >> "$FAKE_NPX_LOG"
