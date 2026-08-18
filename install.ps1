# OAC's binary installer stays disabled until this fork owns and verifies its
# release artifacts, checksums, and signing pipeline.

$ErrorActionPreference = "Stop"
Write-Error "Open Agent Config binary installation is not available yet. Build from source with: npm ci; npm run build; cargo build --release -p oac-cli"
exit 1
