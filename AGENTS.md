# Repository Agent Instructions

## Communication

- Explanations and conclusions must be written in Chinese.
- Comments in source code and configuration files must be written in English.
- Keep changes minimal, source-traceable, and verifiable.

## Mandatory AI Documentation Synchronization

This repository maintains a progressive AI knowledge base under `ai-docs/`.
The source code and the L0-L4 documentation are one synchronized system.

Every change to source code, tests, configuration, generated assets, CI, release
scripts, or user-facing behavior must update the affected L0-L4 module cards in
the same change set. This is a hard completion requirement, not an optional
documentation follow-up.

Before editing code:

1. Read `ai-docs/README.md` and `ai-docs/INDEX.md`.
2. Identify the affected module cards and the relevant L0-L4 records.
3. Record the expected impact in the task plan or the affected module card.

Before declaring a task complete:

1. Update every affected module card, playbook, decision record, and known-risk
   entry.
2. Update `ai-docs/INDEX.md`, `ai-docs/MAP.json`, `ai-docs/COVERAGE.md`, and
   `ai-docs/SYNC_LOG.md` when the module map, coverage, or source anchors change.
3. Use stable source anchors in the form `path::symbol`; line numbers may be
   included as supporting evidence but must not be the only anchor.
4. Record the verified source commit, verification date, status, and known gaps.
5. Run the available AI documentation checks and the relevant source tests.
6. Do not mark a module `verified` when its source anchor, behavior, or test
   evidence has not been checked.

If an affected module card does not exist, create the card before or together
with the implementation. A task is incomplete when code changes are present but
the corresponding L0-L4 documentation is stale, missing, or unverifiable.

## Progressive Loading Contract

- L0: repository purpose, boundaries, packages, entry points, commands, and
  support matrix.
- L1: architecture, dependency relationships, and end-to-end data flows.
- L2: source-traceable module cards with responsibilities, symbols, consumers,
  tests, invariants, and known gaps.
- L3: implementation and verification playbooks for recurring changes.
- L4: Golden QA, failure signatures, decisions, risk evidence, and operational
  validation records.

Always load L0 first. Load L1 for impact analysis, the relevant L2 cards for a
target module, L3 before implementation, and L4 for risk analysis or final
verification. Do not load or generate the whole source tree as a substitute for
the module map.

## AI-DOCS-READY Gate

Kimi Code integration must not begin until the repository passes the
`AI-DOCS-READY` gate:

- full-repository L0 and L1 inventory and architecture map are verified;
- Agent Adapter, Scanner, Manager/Deployer, Skills/MCP formats, frontend
  extension control, and CLI/Web/Desktop boundaries have verified L2 cards;
- the add-agent, Skills toggle, MCP toggle, cross-agent sync, frontend control,
  and cross-platform verification playbooks exist at L3;
- the relevant L4 Golden QA and source-anchor checks pass;
- the index, map, coverage report, and sync log are rebuilt and consistent.

After Kimi implementation begins, update the affected cards in the same change
set and re-run the gate for the changed surface.

## Verification

- Prefer precise, read-only inspection before making changes.
- Run the narrowest relevant tests first, then the repository-wide tests and
  builds when the required toolchains are available.
- Report unverified items explicitly; do not infer success from an exit code
  that did not exercise the changed path.
- Preserve unrelated user changes and never use destructive reset or checkout
  commands without explicit authorization.
