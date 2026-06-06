# Cadence — Habit & Goal Tracker

> A full-stack MERN app for tracking habits, goals, daily check-ins, and focus metrics.
> Built to solve a personal problem — and designed to scale into a SaaS product.

---

## Why I built this

I struggle with habits. Not the tracking — the follow-through. Most apps either overwhelm you with features or reduce everything to a simple streak counter that tells you nothing useful.

Cadence is built around a different idea: track the right things (habits, goals, time wasters, focus quality), surface meaningful patterns over time, and get out of your way.

It started as a personal tool. The plan is to make it available to anyone who has the same problem.

---

## Status

**In active development.** Designed first — 12 screens across 6 views with light and dark mode.

| Module | Status |
|---|---|
| Project setup (MERN + Vite) | ✅ Done |
| Habits CRUD API | ✅ Done |
| Habits UI (basic) | ✅ Done |
| Auth (JWT + User model) | 🔧 In progress |
| Goals — CRUD end to end | ⏳ Planned |
| Daily Check-in | ⏳ Planned |
| Dashboard — aggregate view | ⏳ Planned |
| Metrics & focus scores | ⏳ Planned |
| TypeScript migration (frontend) | ⏳ Planned |
| Tailwind CSS | ⏳ Planned |
| Deploy | ⏳ Planned |

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
- `concurrently` for running client + server together
- REST API with consistent error shape `{ error: { code, message } }`

---

## Features (designed)

- **Dashboard** — daily snapshot: habits due, goals in progress, focus score
- **Habits** — create habits with frequency, track streaks, mark daily completion
- **Goals** — set goals with milestones, link habits to goals
- **Check-in** — daily form: what did you do, what blocked you, focus rating
- **Metrics** — weekly/monthly charts: completion rates, focus trends, time wasters
- **Settings** — preferences, notifications, light/dark mode

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

More endpoints coming as each vertical slice is completed.

---

## Motivation

This project is also how I'm learning full-stack development hands-on — understanding why each piece exists, what breaks without it, and how the full loop from database to UI works. Every decision is intentional and documented.

---

## License

MIT
