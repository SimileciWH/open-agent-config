#!/bin/sh
# OAC's binary installer stays disabled until this fork owns and verifies its
# release artifacts, checksums, and signing pipeline.

set -eu

echo "Open Agent Config binary installation is not available yet." >&2
echo "Build from source with: npm ci && npm run build && cargo build --release -p oac-cli" >&2
exit 1
