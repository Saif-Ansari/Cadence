# Cadence — Habit & Goal Tracker

Full-stack MERN app for tracking habits, goals, focus scores and time wasters.

## Project goal
Learn backend development hands-on while building a real portfolio project.
**Do NOT generate code without explaining it.** Every backend concept should be
taught as we build — why we use it, what breaks without it, what the trade-offs are.

## Stack
- **Frontend:** React 18, Vite, Tailwind (to be added), TypeScript (to be added)
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
12 screens total: Dashboard, Goals, Habits, Check-in, Metrics, Settings (light + dark).

## Data models (planned)
- User, Goal, Habit, HabitLog, CheckIn, Task

## API conventions
- Base URL: `/api`
- Existing: `/api/health`, `/api/habits`
- All routes to be added under `/api/<resource>`
- Error shape: `{ error: { code, message } }`

## Build order (vertical slices)
1. Auth (JWT) + User model
2. Goals — CRUD end to end
3. Habits — CRUD + daily check-off
4. Dashboard — aggregate data
5. Check-in — daily form + history
6. Metrics — computed stats
7. Polish + deploy

## Key rules
- Explain WHY before writing code
- No half-finished features — each slice works end to end before moving on
- TypeScript to be added to frontend before serious component work begins
- Tailwind to be added to client before any UI work
