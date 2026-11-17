# AGENTS.md — How Coding Agents Work in the Brasaland Monorepo

This is the operating protocol for **any** coding agent (Claude Code, Cursor, Windsurf, Copilot, Codex…) in this repository. It is mandatory. If an instruction here conflicts with your defaults, this file wins. If it conflicts with a direct instruction from the developer, ask before acting.

Brasaland is a 14-location grilled-food chain in Colombia and Florida (USA). We are **Brasaland Digital**, building its platform from near zero. Every number we produce must be correct in **USD and COP**.

---

## 1. Session start — read before touching anything

Read these files **in this order** at the start of every session, before planning or editing:

| # | File | Why |
| --- | --- | --- |
| 1 | [`memory-bank/projectbrief.md`](./memory-bank/projectbrief.md) | Business: who Brasaland is, the problem, objectives, non-negotiables |
| 2 | [`memory-bank/productContext.md`](./memory-bank/productContext.md) | Business: departments, users, needs, where each need will live |
| 3 | [`memory-bank/techContext.md`](./memory-bank/techContext.md) | Technical: stack, existing projects, decisions (D1–D8), constraints |
| 4 | [`memory-bank/systemPatterns.md`](./memory-bank/systemPatterns.md) | Technical: **where code goes** (`uis/website`, `uis/backoffice`, `services/`), forbidden parallel trees, domain contract |
| 5 | [`memory-bank/activeContext.md`](./memory-bank/activeContext.md) | Current focus and open questions |
| 6 | [`memory-bank/progress.md`](./memory-bank/progress.md) | What's done, what's next |

Then:

- Load every rule in [`.agents/rules/`](./.agents/rules/) whose scope applies (see §5).
- Read the `README.md` of **every folder you are about to modify**, and of its parent if you are creating a subfolder.
- For milestone work, read [`BRIEFING.md`](./BRIEFING.md). For company facts, [`CONTEXT.md`](./CONTEXT.md) is the source of truth.

If any memory-bank file is missing or contradicts the code, **stop and tell the developer** before going further.

---

## 2. Mandatory delivery workflow — before every commit

No code reaches a commit without passing these steps **in order**. Don't skip or reorder them. If a step fails, fix it and restart from that step.

1. **Branch check.** Confirm you are on a `feature/<short-name>` (or `fix/…`, `docs/…`) branch created from an up-to-date `main` (`git fetch origin && git status`). **Never commit to `main`.**
2. **Scope and placement check.** Run `git status` and `git diff --stat`. Every changed path must:
   - belong in the right folder per [`systemPatterns.md`](./memory-bank/systemPatterns.md) (public site → `uis/website`, internal app → `uis/backoffice`, APIs → `services/`, no new parallel app trees);
   - not touch a protected path (§3) unless the developer confirmed it in this session;
   - contain no secrets, `.env` files (other than `.env.example`), `node_modules/`, `dist/` or build output.
3. **Verify.** Run the checks for **every project you touched**, from inside its folder, and confirm they pass:

   | Touched | Command(s) |
   | --- | --- |
   | `packages/brasaland-operations/**` | `npm run check` |
   | `uis/website/**` | `npm test && npm run build` |
   | `uis/talent-pipeline-tracker/**` | `npm run lint && npm run build` |
   | New project (`uis/backoffice`, `services/api`, …) | Its own test/lint/build commands, documented in its README and added to this table |

   New logic must come with tests, including edge cases (empty arrays, both currencies, invalid data). Don't commit with failing or skipped checks. If you can't run a check, say so explicitly to the developer.
4. **Update docs.** If you added or changed an app, service, package, agent or command, update its folder `README.md` **and** the parent folder README that lists it. Update both the `.md` and `.es.md` versions when both exist.
5. **Update the memory bank.** Run the [`update-memory-bank`](./.agents/skills/update-memory-bank/SKILL.md) skill. At minimum, `progress.md` reflects the change, and `techContext.md` / `systemPatterns.md` / `activeContext.md` reflect any new decision, dependency or focus. Its verify script must pass:
   ```sh
   node .agents/skills/update-memory-bank/scripts/verify.mjs
   ```
6. **Review the staged diff.** `git add <explicit paths>` (never `git add -A` blindly), then read `git diff --staged` in full. Remove debug code, stray files and unrelated changes.
7. **Commit** with a Conventional Commit message: `<type>(<scope>): <summary>` (types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`). Scope = folder or project, e.g. `feat(backoffice): add sales dashboard`, `docs(memory-bank): record API decision`.

**After committing:** push the branch and open a PR to `main` whose description links the changed docs. Once the PR is approved, merge it into `main` so the next branch starts from current code.

---

## 3. Protected paths — do not modify without explicit developer confirmation

Ask first, explain why, and wait for a clear "yes" in the current session. Approval for one change doesn't carry over to others.

| Path | Why it's protected |
| --- | --- |
| `CONTEXT.md`, `CONTEXT.es.md`, `BRIEFING.md`, `company-choice.md` | Company and milestone source of truth, given by the business |
| `AGENTS.md`, `CLAUDE.md`, `.agents/**` | The team agreement itself |
| `memory-bank/projectbrief.md`, `memory-bank/productContext.md` | Business facts. Change them only when the business changes. (The other memory-bank files are updated routinely through the skill) |
| `.devcontainer/**`, `.gitignore`, root `docker-compose.yml`, `infra/**` | Everyone's environment and deployment |
| `packages/brasaland-operations/src/types/models.ts` | Domain contract from `BRIEFING.md`, consumed downstream |
| `packages/shared/**` | Shared types. Changes ripple to every consumer |
| `agents/_template/**`, `skills/_template/**` | Template starters |
| Folder `README.md` / `README.es.md` files from the template | You may **add** entries for new projects. Don't rewrite or delete template guidance |
| `uis/talent-pipeline-tracker/AGENTS.md` | Generated by `next dev`. Leave it as is |
| Any `package-lock.json` | Only change it through `npm install`, never by hand |
| Existing delivered apps (`uis/website`, `uis/talent-pipeline-tracker`, `packages/brasaland-operations`) **outside the scope of the current task** | Don't refactor working, delivered code as a side effect |

Also never, without confirmation: delete files or folders, force-push, rewrite git history, add a dependency, create a new top-level folder, or create a new `uis/` / `services/` subfolder.

---

## 4. When to stop and ask

Stop and ask the developer (don't guess) when:

- A requirement is ambiguous, or doesn't trace back to a department need in `productContext.md`.
- The work would change a financial formula, currency rule, exchange rate, validation rule or time-zone behaviour.
- You'd need a protected path (§3), a new dependency or a new folder.
- The memory bank, `CONTEXT.md`, `BRIEFING.md` and the code disagree.
- A check fails and the fix is outside the task's scope.

---

## 5. Rules and skills

**Rules** live in [`.agents/rules/`](./.agents/rules/). Each declares a `scope` in its front matter:

| Rule | Scope | Applies when |
| --- | --- | --- |
| [`monorepo-structure.md`](./.agents/rules/monorepo-structure.md) | `always` | Every session. Placement, no parallel trees, READMEs first |
| [`memory-bank-maintenance.md`](./.agents/rules/memory-bank-maintenance.md) | `always` | Every session. Keep context current |
| [`brasaland-domain.md`](./.agents/rules/brasaland-domain.md) | `file-pattern` | Editing `packages/brasaland-operations/**`, `services/**`, `uis/backoffice/**`, `data/**` |
| [`frontend-uis.md`](./.agents/rules/frontend-uis.md) | `file-pattern` | Editing `uis/**` |
| [`bilingual-docs.md`](./.agents/rules/bilingual-docs.md) | `agent-requested` | Writing or editing docs/README files, or user-facing copy |

**Skills** live in [`.agents/skills/`](./.agents/skills/). Each `SKILL.md` has one objective, documented inputs and verifiable acceptance criteria:

| Skill | Use it |
| --- | --- |
| [`update-memory-bank`](./.agents/skills/update-memory-bank/SKILL.md) | Step 5 of the delivery workflow, and whenever a decision, feature or problem changes project state |

> `.agents/` configures **how we work**. `agents/`, `skills/` and `mcps/` hold **product code** we build for Brasaland. Don't mix them.
