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

## Data models (planned)
- User, Goal, Habit, HabitLog, Task, CheckIn, Reflection

## API conventions
- Base URL: `/api`
- Existing: `/api/health`, `/api/habits`
- All routes to be added under `/api/<resource>`
- Error shape: `{ error: { code, message } }`

## Build order (vertical slices)
1. Auth (JWT + Google OAuth) + User model
2. Goals — CRUD + task-based progress
3. Habits — CRUD + daily check-off + streak
4. Tasks — CRUD + optional goal link
5. Dashboard — streak, goals, tasks, habits
6. Reflections — form + history list
7. Settings — theme + account
8. Polish + deploy

## Key rules
- Explain WHY before writing code
- No half-finished features — each slice works end to end before moving on
- TypeScript to be added to frontend before serious component work begins
- Tailwind to be added to client before any UI work
