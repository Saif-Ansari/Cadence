# Cadence — Habit & Goal Tracker

> A full-stack MERN app for building consistency — track goals, habits, tasks, and daily reflections in one place.

---

## Why I built this

Most people fail at self-improvement in the same three ways: goals that never get finished, habits that don't stick past the first week, and no honest picture of where time actually goes.

Existing apps solve one of these in isolation. Cadence ties all three together — goals with milestones, habits with a daily tracking loop, and a simple end-of-day reflection that closes the feedback loop. The streak you build by showing up every day is the mechanic that keeps it honest.

---

## Status

**In active development — Phase 1.**

| Module | Status |
|---|---|
| Project setup (MERN + Vite) | ✅ Done |
| TypeScript (frontend) | ✅ Done |
| Tailwind CSS | ✅ Done |
| Auth backend (JWT + User model) | ✅ Done |
| Goals backend (CRUD + milestones) | ✅ Done |
| Auth UI (login + signup) | ✅ Done |
| Dashboard shell (sidebar + layout + routing) | ✅ Done |
| Habits backend + streak logic | ⏳ Next |
| Tasks backend + UI | ⏳ Planned |
| Dashboard API + full UI | ⏳ Planned |
| Reflections backend + UI | ⏳ Planned |
| Settings (theme + account) | ⏳ Planned |
| Deploy | ⏳ Planned |

---

## Features

### Phase 1 (current)

- **Dashboard** — daily snapshot: login streak, active goals, today's tasks, habit grid
- **Goals** — create goals with a deadline and milestones; track progress as milestones are completed
- **Habits** — create habits with a weekly frequency target; mark each day done/not done; build a streak
- **Tasks** — standalone tasks or linked to a goal; today's tasks surface on the dashboard
- **Reflections** — optional end-of-day form: day summary, accomplishments, win of the day, time wasters, focus score (1–10); full history list
- **Auto check-in** — logging in marks the day and increments your streak; no manual button needed
- **Motivational quotes** — a brief, powerful quote on the dashboard and auth screens
- **Settings** — light/dark mode, account management

### Phase 2 (planned)

- Metrics screen — habit completion charts, goal progress, streak history
- Focus Score trend — visualised from Reflections data
- Time Wasters structured tracking — activity + duration
- Habit scheduling — specific days per habit
- Notifications — daily reminder to fill in Reflections
- Forgot password (requires email service)

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TypeScript
- Tailwind CSS v4
- TanStack Query (server state) + Zustand (client state)
- React Router v6

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (bcrypt + jsonwebtoken)

**Tooling**
- `concurrently` — run client + server together from root
- REST API with consistent error shape: `{ error: { code, message } }`

---

## Project Structure

```
cadence/
├── client/                  # React 18 + Vite (port 5173)
│   └── src/
│       ├── components/
│       │   ├── icons/       # SVG icon components
│       │   └── layout/      # Sidebar, ProtectedLayout
│       ├── pages/           # AuthPage, DashboardPage, GoalsPage, ...
│       ├── services/        # API call functions (auth.service.ts, ...)
│       ├── store/           # Zustand stores (auth.store.ts)
│       ├── lib/api.ts       # Base fetch wrapper (attaches JWT)
│       ├── types/           # Shared TypeScript interfaces
│       └── constants/       # Quotes array
├── server/                  # Express + Mongoose (port 5000)
│   ├── controllers/         # req/res handling
│   ├── services/            # Pure business logic
│   ├── models/              # Mongoose schemas
│   ├── routes/              # URL mapping
│   ├── middleware/auth.js   # protect() — JWT verification
│   ├── config/db.js         # MongoDB connection
│   ├── app.js               # Express setup
│   └── index.js             # Entry point
└── package.json             # Root — starts both with concurrently
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/saif-ansari/cadence.git
cd cadence

# Install all dependencies (root + client + server)
npm run install:all

# Add environment variables
cp server/.env.example server/.env
# Fill in MONGO_URI, JWT_SECRET

# Run both client and server
npm run dev
```

Client runs at `http://localhost:5173`  
Server runs at `http://localhost:5000`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account, returns JWT |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/logout` | — | Logout (client clears token) |
| GET | `/api/auth/me` | ✅ | Return current user |

### Goals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/goals` | All goals + milestones + progress % |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal + cascade delete milestones |
| POST | `/api/goals/:id/milestones` | Add milestone |
| PATCH | `/api/goals/:id/milestones/:mid` | Toggle milestone done |
| DELETE | `/api/goals/:id/milestones/:mid` | Delete milestone |

All routes except `/api/auth/signup` and `/api/auth/login` require `Authorization: Bearer <token>`.

More endpoints added as each feature is completed.

---

## Motivation

This project is also how I'm learning full-stack development hands-on — understanding why each piece exists, what breaks without it, and how the full loop from database to UI actually works. Every decision is intentional.

---

## License

MIT
