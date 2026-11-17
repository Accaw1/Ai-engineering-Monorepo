---
name: bilingual-docs
description: Load when writing or editing README/docs files or user-facing copy - keeps EN/ES pairs in sync and copy usable in both Brasaland markets.
scope: agent-requested
alwaysApply: false
globs: []
---

# Rule: Bilingual docs and copy (EN / ES)

**Scope: agent-requested.** Not loaded automatically. The agent loads it when the task involves writing or editing documentation (`README.md`, `README.es.md`, `docs/**`) or customer/staff-facing text.

Brasaland operates in Colombia (Spanish) and Florida (English). The template ships most READMEs in pairs.

## Must

1. If you edit a `README.md` that has a `README.es.md` sibling (or vice versa), make the **equivalent change in both** in the same commit. Same structure, same links, translated prose.
2. New top-level folder READMEs follow the same pair convention. Project-level READMEs (inside an app) may be English-only.
3. User-facing copy: write in one base language and keep strings easy to translate (no text baked into images, no concatenated sentence fragments).
4. Keep names exactly as in `CONTEXT.md` (people, "Brasa Points", "Brasaland Digital") in both languages.

## How to verify

```sh
# Every README.md changed in this branch has its .es.md sibling changed too
git diff --name-only origin/main...HEAD | grep 'README.md$' | while read f; do
  es="${f%README.md}README.es.md"; [ -f "$es" ] && ! git diff --name-only origin/main...HEAD | grep -qx "$es" && echo "unsynced: $es"
done
```
