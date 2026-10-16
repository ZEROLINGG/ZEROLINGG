# AGENTS.md

Astro 7 + Starlight + `starlight-blog` content site, deployed to GitHub Pages (`site: https://zerolingg.github.io`, `base: /ZEROLINGG/`).

## Commands

- Use `pnpm` only (CI pins pnpm 10, Node 22). Install: `pnpm install --frozen-lockfile`.
- `pnpm dev` / `pnpm build` / `pnpm preview`. No lint/test/typecheck scripts.
- Mermaid renders at build time via Playwright Chromium. Local `pnpm build` needs once: `npx playwright install chromium` (see `.github/workflows/deploy.yml`).
- After changing `astro.config.mjs` (esp. `expressiveCode` themes), clear stale render cache: `rm -rf dist .astro node_modules/.astro` before `pnpm build`. CI does this every run.
- Deploy: push to `main` triggers Pages build. `pnpm-workspace.yaml` pins `p-queue: 9.3.3` override — do not bump without checking CI.

## Content model (single `docs` collection)

`src/content.config.ts` defines one `docs` collection (`docsLoader()` + `docsSchema` extended with `blogSchema`, `writeupFields`, `knowledgeFields`). All custom frontmatter is `optional` in zod so landing pages don't break the build — but follow the template conventions below.

- Blog: `src/content/docs/blog/<slug>.md`, requires `date`, `author: ZEROLINGG`, `tags` (see existing post).
- Writeups: new pages MUST be exactly `src/content/docs/writeups/<category>/<slug>.md` (3 segments). `WriteupIndex.astro` excludes `≤2`-segment landing pages, `_template`, and `draft: true`.
  - Start from `src/content/docs/writeups/_template.md`; replace every `{{...}}` placeholder, leave no `{{}}` in output.
  - `category` enum is capitalized: `Pwn/Reverse/Web/Crypto/Misc/Mobile/Blockchain/AI/Forensics/OSINT/Hardware`. `difficulty`/`my_difficulty`: `Easy/Medium/Hard/Insane`.
  - Role split: `subcategory` (single grouping string) vs `vuln_type` (root cause) vs `technique` (exploit method) vs `tags` (free search keywords). Do not mix them.
  - Body must keep `## Meta Info / Summary / Initial Recon / Workflow / Reflection` headings; no H1 in body (Starlight renders `title` from frontmatter).
- Knowledge: same 3-segment rule: `src/content/docs/knowledge/<topic>/<slug>.md` (`rust/reverse/tooling/networking`). Grouped by `topic` in `KnowledgeIndex.astro`.
- Sidebar (`astro.config.mjs`): `writeups`/`knowledge` use `autogenerate: { directory }`, so new subdirs appear automatically. `About`/`Blog` entries are manual.

## Quirks

- `base: '/ZEROLINGG/'` is hardcoded in two places: `astro.config.mjs` head script `src: '/ZEROLINGG/mermaid-theme-swap.js'`. Internal links in index components use `import.meta.env.BASE_URL` — follow that pattern, never hardcode `/ZEROLINGG/...` in new components.
- Mermaid: write ```` ```mermaid ```` blocks; config uses `strategy: 'img-svg'` with light/dark `themeVariables` + `shiki.excludeLangs: ['mermaid']`. `public/mermaid-theme-swap.js` swaps light/dark SVG on `data-theme` change and `astro:page-load`. Don't replace with client-side mermaid.
- Theming lives in `src/styles/custom.css` (Rosé Pine Dawn/Moon tokens, wired via `customCss`). `expressiveCode.themes: ['rose-pine-moon', 'rose-pine-dawn']`.
- `README.md` is the GitHub profile page, not project docs — don't treat it as source of truth for the site.
- Obsidian pasted images: Obsidian writes `![[name.png]]` wikilinks (attachments land in `src/assets/attachments/` per `.obsidian/app.json`), which Astro/GitHub render as literal text. After pasting, run `pnpm fix:images -- --write` (`scripts/fix-obsidian-images.mjs`, Node zero-deps, dry-run by default) to rewrite them as relative `![](.../../../assets/attachments/...)` paths that render in Obsidian + GitHub + Astro. Never hand-write `/ZEROLINGG/...` image URLs.

## Environment source of truth (`.Environment.md`)

- `.Environment.md` (repo root) is the single source of truth for local machine + reverse-tool versions. It was baselined on 2026-10-16 from `fastfetch` and `<tool> --version` outputs.
- Updating: when a tool is upgraded or a new tool enters the workflow, update `.Environment.md` first (re-run the version command, refresh the record date). Never let it go stale.
- Writing writeups: every writeup's `### Environment` section MUST copy versions verbatim from `.Environment.md` and list only tools actually used in that writeup. Do NOT invent versions (`2024.x`, `任意近年版本`, `常规版本` placeholders are forbidden) — if a tool's version is unknown, run the version command and update `.Environment.md` instead of guessing.
