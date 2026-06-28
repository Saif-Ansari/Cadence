# Cadence — Habit & Goal Tracker

> A full-stack MERN app for building consistency — track goals, habits, tasks, and daily reflections in one place.

---

## Why I built this

Most people fail at self-improvement in the same three ways: goals that never get finished, habits that don't stick past the first week, and no honest picture of where time actually goes.

Existing apps solve one of these in isolation. Cadence ties all three together — goals with step-by-step progress, habits with a daily tracking loop, and a simple end-of-day reflection that closes the feedback loop. The streak you build by showing up every day is the mechanic that keeps it honest.

---

## Status

**Phase 1 complete.**

| Module | Status |
|---|---|
| Project setup (MERN + Vite) | ✅ Done |
| TypeScript (frontend) | ✅ Done |
| Tailwind CSS | ✅ Done |
| Auth — JWT, signup, login, streak | ✅ Done |
| Goals — CRUD + Step-based progress | ✅ Done |
| Steps — CRUD, cascade delete, description | ✅ Done |
| Habits — CRUD + daily toggle + streak + consistency heatmap | ✅ Done |
| Tasks — standalone daily todos, lazy DB cleanup | ✅ Done |
| Dashboard — streak, goals summary, today's tasks, habits | ✅ Done |
| Reflections — form, history panel, modals | ✅ Done |
| Settings — change password + theme preference | ✅ Done |
| Deploy | ⏳ Next |

---

## Features

### Phase 1

- **Dashboard** — daily snapshot: login streak, active goals with progress bars, today's tasks (inline create/delete), habit weekly grid
- **Goals** — create goals with a deadline; break each goal into **Steps** (binary progress checklist); progress = done steps / total steps; status auto-computed as On Track / At Risk / Overdue / Completed
- **Habits** — create habits with a weekly frequency target; mark each day done/not done; weekly streak; 5-week consistency heatmap
- **Tasks** — standalone daily todos; created inline on the Dashboard; automatically cleaned from the DB the next day
- **Reflections** — end-of-day form: overall day, accomplishments, win of the day, time wasters, improvements, focus score (1–10); recent history panel; full history modal; read-only entry detail view
- **Settings** — change password; light/dark theme preference (dark styles Phase 2)
- **Auto check-in** — logging in marks the day and increments your streak; no manual button needed
- **Motivational quotes** — a brief, powerful quote on the dashboard and auth screens

### Phase 2 (planned)

- Metrics screen — habit completion charts, goal progress, streak history, focus score trend
- Tasks linked to Steps (three-level hierarchy: Goal → Step → Tasks)
- Habit scheduling — specific days per habit
- Dark mode styles
- Forgot password flow (requires email service)
- Deploy — Vercel (frontend) + Railway (backend) + MongoDB Atlas

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TypeScript
- Tailwind CSS v4
- TanStack Query (server state) + Zustand (client state)
- React Router v6
- Lucide React (icons)

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (bcryptjs + jsonwebtoken)

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
│       │   ├── ui/          # DeletePopover
│       │   └── layout/      # Sidebar, ProtectedLayout, UserMenu
│       ├── pages/           # AuthPage, DashboardPage, GoalsPage,
│       │                    # HabitsPage, ReflectionsPage, SettingsPage
│       ├── services/        # API call functions per resource
│       ├── store/           # Zustand auth store
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
│   ├── app.js               # Express setup + route registration
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

All routes except `/api/auth/signup` and `/api/auth/login` require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account, returns JWT + user |
| POST | `/api/auth/login` | Login, returns JWT + user + streak |
| POST | `/api/auth/logout` | Logout (client clears token) |
| GET | `/api/auth/me` | Return current user + streak |
| PATCH | `/api/auth/password` | Change password (requires current password) |

### Goals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/goals` | All goals with steps + computed progress % |
| POST | `/api/goals` | Create goal |
| PATCH | `/api/goals/:id` | Update goal (title, description, deadline, status) |
| DELETE | `/api/goals/:id` | Delete goal + cascade delete all its steps |

### Steps
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/steps` | Create step (body: goalId, title, description?) |
| PATCH | `/api/steps/:id` | Update step (title, description, done) |
| DELETE | `/api/steps/:id` | Delete step |

### Habits
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/habits` | All habits with 7-day grid + streak |
| POST | `/api/habits` | Create habit |
| PATCH | `/api/habits/:id` | Update habit |
| DELETE | `/api/habits/:id` | Delete habit |
| PATCH | `/api/habits/:id/toggle` | Toggle log for a given date |
| GET | `/api/habits/consistency` | 5-week rolling heatmap data |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks?today=true` | Today's tasks (lazy-deletes yesterday's undated tasks) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task (title, done) |
| DELETE | `/api/tasks/:id` | Delete task |

### Reflections
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reflections/today` | Today's reflection or null |
| PUT | `/api/reflections/today` | Upsert today's reflection |
| GET | `/api/reflections` | All reflections, newest first |
| GET | `/api/reflections/:id` | Single reflection by id |

---

## Motivation

This project is also how I'm learning full-stack development hands-on — understanding why each piece exists, what breaks without it, and how the full loop from database to UI actually works. Every decision is intentional.

---

## License

MIT
