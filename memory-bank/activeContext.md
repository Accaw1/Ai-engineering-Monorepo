# Active Context — What We're Working On Now

Last updated: 2026-11-17

> Short-lived context: current focus, recent decisions and open questions. Rewrite this file whenever the focus changes. Long-term history goes in [`progress.md`](./progress.md).

## Current focus

**Milestone 4: Monorepo AI setup** (branch `feature/agent-memory-bank`). Give coding agents persistent context and a delivery protocol before more features are added:

- `memory-bank/` with business + technical context
- `AGENTS.md` with the session-start reads, the pre-commit workflow and protected paths
- `.agents/rules/` (scoped rules) and `.agents/skills/update-memory-bank/` (first skill)

No application code changes in this milestone.

## Recent decisions

- Coding-agent config (`AGENTS.md`, `.agents/`, `memory-bank/`) is kept separate from product AI folders (`agents/`, `skills/`, `mcps/`). See D8 in [`techContext.md`](./techContext.md).
- Application placement is fixed: public site → `uis/website`, internal app → `uis/backoffice`, APIs → `services/`. See [`systemPatterns.md`](./systemPatterns.md).
- `CLAUDE.md` only imports `AGENTS.md`, so every tool reads the same protocol.

## Open questions (ask the developer; don't decide alone)

1. Should `uis/talent-pipeline-tracker` move into `uis/backoffice` once the backoffice exists?
2. Which backoffice stack? The Next.js used by the Talent Tracker is the likely candidate, but it is not decided.
3. When do we add a root workspace (pnpm/npm workspaces) and `docker-compose.yml`?
4. When should the fixed 1 USD = 4000 COP rate be replaced by a real FX source?

## Next immediate step

After this PR is merged into `main`: start the next milestone from an up-to-date `main` and update this file with its focus.
