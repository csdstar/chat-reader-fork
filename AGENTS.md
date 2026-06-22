# Repository Guidelines

## Project Structure & Module Organization

- `src/app/`: application entry points, global styles, metadata, and icons.
- `src/components/`: feature components such as the sidebar, chat area, dialogs, and input.
- `src/components/ui/`: reusable shadcn/Radix UI primitives.
- `src/lib/`: book parsing, EPUB parsing, IndexedDB storage, and shared utilities.
- `src/types/`: shared TypeScript interfaces.
- `public/`: static assets, including ChatGPT-style icons under `public/icons/`.

Do not commit `.next/` or `node_modules/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the local development server at `http://localhost:3000`.
- `npm run lint`: run ESLint with Next.js Core Web Vitals and TypeScript rules.
- `npm run build`: create a production build and run TypeScript validation.
- `npm run start`: serve an existing production build.

Before opening a pull request, run both `npm run lint` and `npm run build`.

## Coding Style & Naming Conventions

Use strict TypeScript and React functional components. Follow the existing two-space indentation and nearby quote style. Component names use PascalCase, functions and state use camelCase, and component filenames use kebab-case, for example `message-bubble.tsx`.

Use the `@/` path alias for imports from `src/`. Prefer existing UI primitives and Tailwind utility classes over new one-off CSS. Keep browser-only APIs inside client components or dynamically imported helpers.

## Parsing & Persistence

TXT parsing uses the `ChapterPattern` modes in `src/lib/book-parser.ts`. List-like text such as `1、条目` must not match strict Chinese mode. Update the settings dialog and README when adding a pattern.

IndexedDB stores books, messages, and raw TXT sources separately. Keep raw sources out of `Book` so progress saves stay lightweight. Increment `DB_VERSION` when changing stores.

## Testing Guidelines

No automated test framework is currently configured. Treat lint and production builds as required checks. Manually verify TXT/EPUB import, chapter navigation, pattern re-parsing, persistence after reload, and the settings dialog at short viewport heights.

When adding tests, place focused `*.test.ts` or `*.test.tsx` files beside the module they cover. Parser changes should include representative chapter-title fixtures and malformed-input cases.

## Commit & Pull Request Guidelines

Recent commits use concise, imperative summaries; newer commits use a Chinese category prefix such as `【界面优化】` or `【文档更新】`. Keep each commit focused.

Pull requests should explain user-visible behavior, list verification commands, and include before/after screenshots for UI changes. Mention storage migrations, dependency additions, and any EPUB compatibility limitations. Link related issues when available.
