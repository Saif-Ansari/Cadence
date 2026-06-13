# Cadence — Habit & Goal Tracker

> A full-stack MERN app for building consistency — track goals, habits, tasks, and daily reflections in one place.
> Built to solve a personal problem, designed to scale into a SaaS product.

---

## Why I built this

Most people fail at self-improvement in the same three ways: goals that never get finished, habits that don't stick past the first week, and no honest picture of where time actually goes.

Existing apps solve one of these in isolation. Cadence ties all three together — goals with milestones, habits with a daily tracking loop, and a simple end-of-day reflection that closes the feedback loop. The streak you build by showing up every day is the mechanic that keeps it honest.

It started as a personal tool. The plan is to make it available to anyone with the same problem.

---

## Status

**In active development — Phase 1.**

| Module | Status |
|---|---|
| Project setup (MERN + Vite) | ✅ Done |
| Habits CRUD API | ✅ Done |
| Auth (JWT + User model) | 🔧 In progress |
| Goals — CRUD + milestones | ⏳ Planned |
| Tasks — CRUD + goal link | ⏳ Planned |
| Dashboard — streak, goals, tasks, habits | ⏳ Planned |
| Reflections — form + history | ⏳ Planned |
| Settings — theme + account | ⏳ Planned |
| TypeScript migration (frontend) | ⏳ Planned |
| Tailwind CSS | ⏳ Planned |
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
- **Motivational quotes** — a brief, powerful quote on the dashboard and auth screens; a deliberate daily anchor
- **Settings** — light/dark mode, account management

### Phase 2 (planned)

- Metrics screen — habit completion charts, goal progress, streak history
- Focus Score trend — visualised from Reflections data
- Time Wasters structured tracking — activity + duration; shown in Metrics
- Habit scheduling — specific days per habit
- Notifications — daily reminder to fill in Reflections
- Streak pause with restrictions

---

## Tech Stack

**Frontend**
- React 18 + Vite
- TypeScript *(migration in progress)*
- Tailwind CSS *(to be added)*

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication *(in progress)*

**Tooling**
- `concurrently` — run client + server together from root
- REST API with consistent error shape: `{ error: { code, message } }`

---

## Project Structure

```
cadence/
├── client/          # React 18 + Vite (port 5173)
│   └── src/
│       ├── App.jsx
│       └── main.jsx
├── server/          # Express + Mongoose (port 5000)
│   ├── models/
│   │   └── Habit.js
│   ├── routes/
│   │   └── habits.js
│   └── index.js
└── package.json     # Root — starts both with concurrently
```

---

## Getting Started

```bash
# Clone
git clone https://github.com/saif-ansari/cadence.git
cd cadence

# Install all dependencies (root + client + server)
npm run install:all

# Add your MongoDB URI
echo "MONGO_URI=your_mongodb_connection_string" > server/.env
echo "PORT=5000" >> server/.env

# Run both client and server
npm run dev
```

Client runs at `http://localhost:5173`  
Server runs at `http://localhost:5000`

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/habits` | Get all habits |
| POST | `/api/habits` | Create a habit |
| PATCH | `/api/habits/:id/toggle` | Toggle habit completion |
| DELETE | `/api/habits/:id` | Delete a habit |

More endpoints added as each feature is completed.

---

## Motivation

This project is also how I'm learning full-stack development hands-on — understanding why each piece exists, what breaks without it, and how the full loop from database to UI actually works. Every decision is intentional.

---

## License

MIT
