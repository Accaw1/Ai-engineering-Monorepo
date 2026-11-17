---
name: memory-bank-maintenance
description: The memory bank is read at session start and updated in the same branch as every change that alters project state.
scope: always
alwaysApply: true
globs: []
---

# Rule: Keep the memory bank alive

**Scope: always active.**

The memory bank (`memory-bank/`) is the project's active context, not static documentation. An outdated memory bank is worse than none, because it makes agents confidently wrong.

## Must

1. **Read** all six memory-bank files at session start, in the order given in `AGENTS.md` §1.
2. **Update** the memory bank **in the same branch/PR** as any change to product folders (`uis/`, `services/`, `packages/`, `agents/`, `skills/`, `mcps/`, `workflows/`, `data/`, `shared/`, `infra/`, `scripts/`, `internal/`). Use the [`update-memory-bank`](../skills/update-memory-bank/SKILL.md) skill.
3. Record in the right file:
   | Event | File |
   | --- | --- |
   | Feature started / finished, next steps changed | `progress.md` |
   | Current focus or open question changed | `activeContext.md` |
   | New dependency, stack choice, command, constraint, architectural decision | `techContext.md` (decisions table D#) |
   | New app/service/folder, new placement rule, domain contract change | `systemPatterns.md` |
   | Business fact changed (locations, people, objectives) | `projectbrief.md` / `productContext.md`, **only with developer confirmation** |
4. Bump the `Last updated: YYYY-MM-DD` line of every file you edit.
5. Use real, specific facts (paths, commands, names from `CONTEXT.md`). No placeholders.

## Must not

- Copy code or long command output into the memory bank. Link to the file instead.
- Leave decisions only in chat or in a PR description.
- Delete history from `progress.md`. Move items from "In progress" to "Completed" instead.
