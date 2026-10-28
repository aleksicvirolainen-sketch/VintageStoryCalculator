# Vintage Story Calculator

Svelte 5 + Vite 6 + TypeScript calculator app for Vintage Story (alloying, casting, usage finder, charcoal). CI in `.forgejo/workflows/`, issue templates in `.gitea/ISSUE_TEMPLATE/`, PR template in `.forgejo/pull_request_template.md`, deploys to Netlify.

## Commands

- `npm install` — install deps
- `npm run dev` — hot-reload dev server (port 5173)
- `npm run build` — production build (`test` is `vite build --mode production`)
- `npm run preview` — serve production build locally
- `npm run lint` — ESLint (TS recommended; browser globals, node for `*.config.js`/`scripts/`)
- `npm run format` / `npm run format:check` — Prettier write / check. Commits format staged files automatically (lint-staged).
- `node scripts/production-smoke-test.mjs` — post-deploy route/asset/header check
- `node scripts/release.mjs` — dry run of the release planner: next version and bump since the latest stable tag (writes nothing)

## Conventions

- Follow existing patterns in `src/` (`components/`, `routes/`, `lib/`, `stores/`, `data/`); minimal diffs, no new deps or refactors alongside fixes.
- Done means: `npm run lint` + `npm run build` pass, changed path exercised, no new console errors.

## Docs and changes

- Update `README.md` / `CONTRIBUTING.md` / `RELEASE.md` when behavior, setup, or process changes.
- Commits: conventional (`feat:` / `fix:` / `docs:` / `refactor:` / `chore:`). Enforced locally via a `commit-msg` git hook (husky + commitlint, installed automatically by `npm install`); `npm run lint` runs via the `pre-commit` hook. The type sets the release version (see `RELEASE.md`). PR body follows `.forgejo/pull_request_template.md` and discloses material AI assistance.
- Merges to `master` release automatically through CI; deploys are manual `Deploy` runs. Never tag, release, or deploy autonomously.
