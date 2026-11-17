---
name: update-memory-bank
description: Bring memory-bank/ in line with the changes on the current branch before committing. Use at step 5 of the AGENTS.md delivery workflow, or whenever a feature, decision or problem changes project state.
---

# Skill: update-memory-bank

## Objective (single)

Make the memory bank (`memory-bank/*.md`) accurately describe the repository **as it will be after the current branch is merged**, so the next agent session starts with correct context.

Out of scope: writing product code, changing business facts without confirmation, editing `AGENTS.md` or rules.

## When to use

- Step 5 of the delivery workflow in [`AGENTS.md`](../../../AGENTS.md), before **every** commit that touches product folders.
- After making an architectural decision, adding a dependency, creating an app/service, finishing or starting a feature, or hitting a problem worth remembering.

## Inputs

| Input | Required | Source / how to get it |
| --- | --- | --- |
| `base` | No (default `origin/main`, falling back to `main`) | The branch you'll merge into |
| Changed files | Yes | `git diff --name-status $(git merge-base <base> HEAD)` plus `git status --porcelain` (staged, unstaged, untracked) |
| Change summary | Yes | What the change does and why, in 1–3 sentences (from the task / developer) |
| Decisions made | If any | New dependency, stack choice, constraint, placement or domain-contract change |
| Today's date | Yes | `YYYY-MM-DD`, for the `Last updated:` lines |
| Developer confirmation | Only if `projectbrief.md` / `productContext.md` must change | Explicit "yes" in the current session |

## Procedure

1. **Collect changes.** List every changed path against `base` (committed + working tree).
2. **Classify each change** using the table in [`.agents/rules/memory-bank-maintenance.md`](../../rules/memory-bank-maintenance.md):
   - Feature progress / next steps → `progress.md`
   - Focus / open questions → `activeContext.md`
   - Stack, dependency, command, constraint, decision → `techContext.md` (add a `D#` row for decisions; add any new project with its verify commands to "Existing projects")
   - New folder/app/service, placement or domain-contract change → `systemPatterns.md`
   - Business fact → `projectbrief.md` / `productContext.md` (**stop and ask first**)
3. **Edit** the affected files with concrete facts: paths, commands, names, dates. In `progress.md`, add or move the row (In progress → Completed) and revise "Planned next steps".
4. **Bump** `Last updated: <today>` in every file you edited.
5. **Verify.** Run the script and fix every `FAIL`:
   ```sh
   node .agents/skills/update-memory-bank/scripts/verify.mjs            # base defaults to origin/main
   node .agents/skills/update-memory-bank/scripts/verify.mjs --base main
   ```
6. **Report** to the developer: which memory-bank files changed and a one-line reason for each, plus any `WARN` lines.

## Expected output

- Updated `memory-bank/*.md` files in the working tree, ready to be staged in the same commit as the change.
- A short report: `file → what changed → why`.
- Script output ending in `RESULT: PASS`.

## Acceptance criteria (all must hold; each one can be checked)

| # | Criterion | How to verify |
| --- | --- | --- |
| AC1 | All six required files exist and are non-empty: `projectbrief.md`, `productContext.md`, `techContext.md`, `systemPatterns.md`, `activeContext.md`, `progress.md` | `verify.mjs` check **required-files** |
| AC2 | Every memory-bank file has a valid `Last updated: YYYY-MM-DD` line that is not in the future | `verify.mjs` check **last-updated** |
| AC3 | If the branch changes any product folder (`uis/`, `services/`, `packages/`, `agents/`, `skills/`, `mcps/`, `workflows/`, `data/`, `shared/`, `infra/`, `scripts/`, `internal/`), then `memory-bank/progress.md` is also changed, and its `Last updated` is on or after the branch's base commit date | `verify.mjs` check **progress-updated** |
| AC4 | Every **new** project manifest (`package.json`, `pyproject.toml`) added on the branch has its folder path mentioned in `techContext.md` | `verify.mjs` check **new-projects-documented** |
| AC5 | No placeholders remain (`TODO`, `TBD`, `lorem ipsum`, `<company…>`, `{{…}}`, `[placeholder]`) | `verify.mjs` check **no-placeholders** |
| AC6 | Every relative Markdown link in the memory bank resolves to an existing file | `verify.mjs` check **links-resolve** |
| AC7 | `projectbrief.md` / `productContext.md` are only changed with developer confirmation | `verify.mjs` emits **WARN** if they changed. The agent must cite the confirmation in its report |
| AC8 | The script exits with code `0` and prints `RESULT: PASS` | `echo $?` → `0` |

If any criterion fails, the skill has not been completed. Don't commit.

## Example

> Branch adds `services/api/pyproject.toml` and a `/locations` router.
> - `techContext.md`: add `services/api` to "Existing projects" (FastAPI, `uv run pytest`), plus row `D9: FastAPI + uv for services/api`.
> - `systemPatterns.md`: `services/` status → "Exists (`services/api`)".
> - `progress.md`: "In progress: Central API — `/locations`"; next steps re-ordered.
> - `activeContext.md`: focus = central API.
> - `verify.mjs` → `RESULT: PASS`.
