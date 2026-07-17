# Cadence — Habit & Goal Tracker

Full-stack MERN app for tracking goals, habits, tasks, and daily reflections.

## Project goal
Learn backend development hands-on while building a real portfolio project.
**Do NOT generate code without explaining it.** Every backend concept should be
taught as we build — why we use it, what breaks without it, what the trade-offs are.

## Stack
- **Frontend:** React 18, Vite, Tailwind v4, TypeScript, Lucide React (icons), TanStack Query, Zustand, `@radix-ui/react-dialog` (modal primitive — focus trap, Escape-to-close, scroll lock)
- **Backend:** Node.js, Express, MongoDB, Mongoose, helmet, express-rate-limit
- **Package manager:** npm
- **Dev:** `npm run dev` from root (runs both client + server via concurrently)

## Project structure
```
technicalProject/
├── client/          # React frontend (Vite, port 5173)
│   └── src/
├── server/          # Express backend (port 5000)
│   ├── models/      # Mongoose schemas
│   ├── routes/      # Express routers
│   └── index.js     # Entry point
└── package.json     # Root — runs both with concurrently
```

## Design
All screens are designed in Paper Desktop — file: "Technical Project".
Phase 1 screens (light variant designed): Login, Sign up, Dashboard, Goals, Habits, Reflections, Settings.
Phase 2 screen designed: Metrics.

**Design conventions:**
- Logo: teal `#0D9488` rounded square (8px radius, 32×32) with ascending bars SVG (white, 16×16) + "Cadence" wordmark
- Primary colour: `#0D9488` (teal) — buttons, sidebar accents, logo bg
- Sidebar/panel bg: `#F8FAFC` | Border: `#E2E8F0` | Heading: `#0F172A` | Font: Inter
- Motivational quote: appears on the Dashboard and on the left panel of auth screens (Login, Sign up). Serves as a daily anchor — brief, powerful, contextually relevant. Designed as a deliberate feature, not decoration.

## Data models
- **User** — auth + profile
- **Goal** — title, description, deadline, status
- **Step** — belongs to a Goal (`goalId`); title, description, done (binary checkbox). Goal progress = done/total steps.
- **Habit** — name, targetFrequency, description, status; tracked via HabitLog
- **HabitLog** — one doc per habit per day; toggle creates/deletes
- **Task** — standalone daily todo (title, dueDate, done); no goal link. Lazy-deleted on next day's fetch.
- **CheckIn** — one doc per day per user; drives login streak
- **Reflection** — one doc per day per user (upsert); fields: overallDay, accomplished, win, wastedTime, improvement, focusScore (1–10)

### Architecture decision: Goal → Steps, Tasks separate
Goals break down into **Steps** (binary progress checklists). Tasks are **standalone today-only todos** — no goal link. Steps are a separate model (`server/models/Step.js`). Phase 2 will add tasks linkable to steps (three-level hierarchy).

## API conventions
- Base URL: `/api`
- Routes: `/api/health`, `/api/auth`, `/api/goals`, `/api/steps`, `/api/habits`, `/api/tasks`, `/api/reflections`
- Error shape: `{ error: { code, message } }`
- Steps: `POST /api/steps`, `PATCH /api/steps/:id`, `DELETE /api/steps/:id`
- Habits consistency: `GET /api/habits/consistency` — 5-week rolling heatmap data
- Reflections: `GET /api/reflections/today`, `PUT /api/reflections/today` (upsert), `GET /api/reflections`, `GET /api/reflections/:id`, `DELETE /api/reflections/:id`
- Auth password: `PATCH /api/auth/password` — requires `currentPassword` + `newPassword`
- Day-boundary convention: any endpoint whose result depends on "today" (login/check-in, `GET /api/habits`, `GET /api/habits/consistency`, `GET|PUT /api/reflections/today`, `GET /api/auth/me`) accepts an optional client-supplied `localDate` (`'YYYY-MM-DD'`, the user's real local calendar day — client computes it via `client/src/lib/date.ts`'s `todayLocalDateString()`, never `toISOString()` which is UTC and can be off by a day near midnight). The server never derives "today" from its own clock — see `server/utils/dateOnly.js`.
- Signup cap: `POST /api/auth/signup` rejects with `403 SIGNUPS_CLOSED` once `User.countDocuments() >= MAX_USERS`. `MAX_USERS` is an env var, unset by default (unlimited) — dev/test never set it, so this only activates when explicitly configured for a deploy meant for a small, known group. Not tied to a specific hosting quota (MongoDB Atlas's free tier is capped by storage, not user count) — it's a safety net against an open public signup form, not a technical requirement.
- Goal delete guard: `DELETE /api/goals/:id` rejects with `409 INCOMPLETE_STEPS` if any of the goal's steps have `done: false`. All steps must be completed (or the goal must have none) before it can be deleted.

## Frontend/backend URL split
The client and server are separate deploys (Vercel + Railway) on different domains — `client/src/lib/api.ts`'s `BASE_URL` is `import.meta.env.VITE_API_URL || '/api'`. In dev, the `/api` fallback works because `vite.config.ts` proxies it to `localhost:5000` (for both `vite dev` and `vite preview` — mirrored so `npm run build && npm run preview` sanity-checks the production bundle locally with zero env setup). In production, `VITE_API_URL` must be set (Vercel dashboard or `.env.production`) to the deployed Railway URL — see `client/.env.example`.

## UI conventions
- Delete confirmation: always use `<DeletePopover>` (`client/src/components/ui/DeletePopover.tsx`) — never inline confirm. Click-outside closes it. `itemName` is optional — omit it for items whose name could be arbitrarily long (e.g. task titles) to get a generic "delete this?" message instead of interpolating the name. `placement` defaults to `'top'` (opens above the trigger, fits list rows); pass `placement="bottom"` when the trigger sits near the top of its container (e.g. a modal header) so the popover doesn't get clipped by the container's scroll/overflow boundary.
- Delete buttons: always visible (not hover-only), default `text-red-400 hover:text-red-600`
- Add step / add habit: modal, not inline form
- Modals: always use `<Modal>` / `<ModalTitle>` (`client/src/components/ui/Modal.tsx`, wraps `@radix-ui/react-dialog`) — never a hand-rolled `fixed inset-0` backdrop div. Gives focus trapping, Escape-to-close, and scroll lock for free.
- Query loading/error states: wrap query-backed sections in `<QueryState>` (`client/src/components/ui/QueryState.tsx`) instead of falling back to `data ?? []` — that fallback can't distinguish "still loading" from "request failed". Pass a `skeleton` shaped like the real content; use `<Skeleton>` (`client/src/components/ui/Skeleton.tsx`) as the building block.
- Mutation errors: never add a per-mutation `onError` for showing failures — the global `QueryClient`'s `MutationCache.onError` (wired in `client/src/main.tsx`) already routes every failed mutation to a toast (`client/src/store/toast.store.ts` + `client/src/components/ui/ToastStack.tsx`).
- Shared goal status logic lives in `client/src/lib/goalStatus.ts` — import `computeGoalStatus`, `STATUS_STYLES`, `STATUS_LABELS`, `PROGRESS_COLOR` from there; do not duplicate
- Shared habit weekly-completion math lives in `client/src/lib/habitStats.ts` (`computeWeeklyRate`) — used by both HabitsPage and the Dashboard stat strip; do not duplicate
- Responsive: sidebar is a fixed overlay on mobile (`< lg`), managed by `ProtectedLayout`; page containers use `p-4 lg:p-8` pattern; multi-column grids use `grid-cols-1 lg:grid-cols-N`
- Dark mode: implemented via Tailwind v4's `@custom-variant dark (&:where(.dark, .dark *));` (declared in `client/src/index.css`) — `dark:` classes key off a `.dark` class on `<html>`, not the OS preference. Toggle/persist via `client/src/lib/theme.ts` (`applyTheme`/`getStoredTheme`), applied once at boot in `main.tsx` (before first render, to avoid a flash) and again from the Settings toggle. When adding new UI, pair every `bg-white`/`text-slate-*`/`border-slate-*` with a `dark:` equivalent — see existing pages for the established shade mapping (e.g. `text-slate-900` → `dark:text-slate-100`, `bg-slate-100` → `dark:bg-slate-800`).

## Build order (vertical slices)
1. ✅ Auth (JWT) + User model
2. ✅ Goals — CRUD + Step-based progress
3. ✅ Habits — CRUD + daily check-off + streak + consistency heatmap
4. ✅ Tasks — standalone daily todos, inline create/delete on Dashboard, lazy DB cleanup
5. ✅ Dashboard — streak, goals summary, today's tasks, habits summary
6. ✅ Reflections — form + history list + entry detail modal
7. ✅ Settings — change password + theme preference
8. ✅ Code review — security fixes, performance (indexes, bounded queries), refactor
9. ✅ Mobile/tablet responsive — sidebar overlay, stacking layouts
10. ✅ Tests — Jest/Supertest integration (backend), Vitest unit (frontend)
10.5. ✅ Pre-deploy hardening + visual pass (2026-07-07/08) — a second, more thorough review before Deploy:
    - Backend: env-driven CORS, JWT_SECRET fail-fast, helmet + rate limiting on `/api/auth`, NoSQL-injection guard on auth inputs, centralized error middleware (`server/middleware/errorHandler.js`) replacing per-controller try/catch, `runValidators: true` on all update queries, a client-supplied `localDate` convention for day-boundary logic (check-ins/reflections/habit logs) instead of the server's own clock — see `server/utils/dateOnly.js`
    - Frontend: `<QueryState>` loading/error handling on every page, a global toast system for mutation failures, dark mode (see UI conventions above), skeleton loaders, the Inter font, a rotating daily quote on Dashboard + Auth, a Dashboard stat strip, and the shared `<Modal>` extraction covering all 7 modals
10.6. ✅ Bug fixes + product-rule tightening from live use (2026-07-11), found by actually using the deployed-soon app:
    - Goals: deleting a goal is blocked (409 `INCOMPLETE_STEPS`) while any of its steps are still undone — the delete button in `GoalsPage` is disabled with a tooltip explaining why, mirroring the existing "mark complete" button's pattern
    - Habits: days before a habit's `createdAt` are flagged (`weekGrid[].beforeCreation`) and rendered greyed-out/non-toggleable instead of showing as missed; `calculateStreak` stops at the habit's creation week instead of requiring weeks that predate it
    - Reflections: added `DELETE /api/reflections/:id` + a delete button in the Entry Detail modal; fixed the pre-fill `useEffect` in `ReflectionsPage` that only ever populated form fields and never cleared them — a new day with no entry yet now correctly resets the form instead of continuing to show the previous day's text
    - `client/vercel.json` added (SPA rewrite — `client/src/App.tsx` uses React Router client-side routes, which 404 on Vercel without this)
11. ✅ Deploy (2026-07-18) — **Vercel + Render + MongoDB Atlas** (switched from Railway to Render mid-deploy — Railway's trial-credit model prompted a look at alternatives; Render's zero-config GitHub-import flow is nearly identical). Live at `https://cadence-tau-self.vercel.app` (frontend) + `https://cadence-7sy1.onrender.com` (backend, Root Directory `server`, free tier — spins down after ~15min idle, ~30-50s cold start on the next request). Atlas cluster in `AWS Mumbai (ap-south-1)`; Render region set to Singapore to minimize latency to it.
    - Real bugs hit and fixed during this deploy: (1) `client/src/lib/api.ts`'s `VITE_API_URL` requires an explicit Vercel redeploy to bake into the bundle — env var changes don't apply retroactively; (2) a stale browser-cached JS bundle briefly made requests hit the Vercel domain instead of the backend, causing a `405` (Vercel's SPA rewrite serves `index.html` for unmatched paths, which only accepts GET) — fixed by hard-refresh, not a real bug; (3) `CORS_ORIGINS` with a trailing slash never matches a browser's `Origin` header (which never has one) — silent CORS failure; (4) the real root cause was subtler: the Render env var was literally misnamed `CORS_ORIGIN` (missing the `S`), so `process.env.CORS_ORIGINS` was `undefined` and the code fell back to the `localhost` defaults the whole time — confirmed via a temporary `/api/debug-cors` endpoint (added, used, then removed) rather than continuing to guess from dashboard screenshots.
    - Two credential exposures happened during this deploy (both from the user pasting real values into chat/screenshots) — both rotated: the Atlas DB user password (twice) and `JWT_SECRET` (visible in a dashboard screenshot). Neither is a code issue — just a reminder that generated secrets shouldn't be typed into a chat, even a private one.

## Testing
- **Backend:** `cd server && npm test` — Jest + Supertest + mongodb-memory-server; tests in `server/__tests__/` (7 suites, 49 tests)
- **Frontend:** `cd client && npm test` — Vitest; tests colocated in `__tests__/` next to source (5 files, 22 tests). Default environment is plain Node (no jsdom installed) — tests needing `document`/`localStorage` (e.g. `lib/theme.ts`) stub just those globals manually rather than pulling in jsdom for two lines of logic.
- Backend coverage: auth (signup/login/password, NoSQL-injection guard on both signup and login, `MAX_USERS` signup cap), goals (CRUD/cascade/NoSQL guard, incomplete-steps delete guard), habits (CRUD/cascade, day toggle, weekly grid anchored on `localDate`, pre-creation day flagging, streak fairness around a habit's creation week), reflections (upsert/isolation/focusScore validation, `localDate` day-boundary behavior, delete + per-user isolation on delete), `dateOnly.js` utilities (UTC anchoring, timezone-independence), rate limiting (real 429 behavior, verified by temporarily unsetting the test-mode bypass), centralized error handling (malformed id → clean 400, unknown route → JSON 404)
- Frontend coverage: `goalStatus`, `habitStats` (`computeWeeklyRate`), `quotes` (`getTodaysQuote` daily rotation), `date` (`todayLocalDateString`), `theme` (`applyTheme`/`getStoredTheme`)
- The `/api/auth` rate limiter (`server/app.js`) is skipped when `NODE_ENV === 'test'` (Jest sets this automatically) — the test suite's normal signup/login volume across files would otherwise risk tripping it. The real limiting behavior still has its own dedicated test that overrides the bypass.

## Key rules
- Explain WHY before writing code
- No half-finished features — each slice works end to end before moving on
- TypeScript to be added to frontend before serious component work begins
- Tailwind to be added to client before any UI work
