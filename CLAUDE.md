# Cadence — Habit & Goal Tracker

Full-stack MERN app for tracking goals, habits, tasks, and daily reflections.

## Project goal
Learn backend development hands-on while building a real portfolio project.
**Do NOT generate code without explaining it.** Every backend concept should be
taught as we build — why we use it, what breaks without it, what the trade-offs are.

## Stack
- **Frontend:** React 18, Vite, Tailwind, TypeScript, Lucide React (icons)
- **Backend:** Node.js, Express, MongoDB, Mongoose
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
- Reflections: `GET /api/reflections/today`, `PUT /api/reflections/today` (upsert), `GET /api/reflections`, `GET /api/reflections/:id`
- Auth password: `PATCH /api/auth/password` — requires `currentPassword` + `newPassword`

## UI conventions
- Delete confirmation: always use `<DeletePopover>` (`client/src/components/ui/DeletePopover.tsx`) — never inline confirm. Click-outside closes it.
- Delete buttons: always visible (not hover-only), default `text-red-400 hover:text-red-600`
- Add step / add habit: modal, not inline form
- Shared goal status logic lives in `client/src/lib/goalStatus.ts` — import `computeGoalStatus`, `STATUS_STYLES`, `STATUS_LABELS`, `PROGRESS_COLOR` from there; do not duplicate
- Responsive: sidebar is a fixed overlay on mobile (`< lg`), managed by `ProtectedLayout`; page containers use `p-4 lg:p-8` pattern; multi-column grids use `grid-cols-1 lg:grid-cols-N`

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
11. Deploy — Vercel (frontend) + Railway (backend) + MongoDB Atlas

## Testing
- **Backend:** `cd server && npm test` — Jest + Supertest + mongodb-memory-server; tests in `server/__tests__/`
- **Frontend:** `cd client && npm test` — Vitest; tests colocated in `__tests__/` next to source
- Tests cover: auth (signup/login/password), goals (CRUD/cascade/NoSQL guard), reflections (upsert/isolation), goalStatus utilities

## Key rules
- Explain WHY before writing code
- No half-finished features — each slice works end to end before moving on
- TypeScript to be added to frontend before serious component work begins
- Tailwind to be added to client before any UI work
