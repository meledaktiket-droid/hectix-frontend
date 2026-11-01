#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "${1:-}" == "--teardown-only" ]]; then
  exec npx tsx -e 'import("./global-teardown.ts").then(m => m.default())'
fi
exec npx playwright test "$@"
