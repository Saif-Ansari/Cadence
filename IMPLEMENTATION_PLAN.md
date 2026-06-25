# Cadence — Implementation Plan

**Working schedule:** Weekends only (Saturday + Sunday)  
**Started:** June 2026  
**Target MVP:** October 2026

---

## Tech decisions

Decisions locked in before frontend work begins.

### State management
- **Server state (API data):** TanStack Query — handles fetching, caching, and invalidation. Every resource (habits, goals, tasks) maps to a `queryKey`. Mutations call `invalidateQueries` to keep all screens in sync automatically.
- **Client state (browser-only):** Zustand — holds the logged-in user and theme preference. Simple store, no Redux boilerplate.
- **Kicks in:** Weekend 3 (Auth UI) — install both libraries before writing the first page component.

### UI components
- **Plain Tailwind** for everything — inputs, buttons, badges, progress bars, cards.
- **No component library.** The designs use a custom teal palette and specific layouts — a styled library would fight them.
- **Exception:** if a modal needs proper accessibility (focus trapping, keyboard close), add `@radix-ui/react-dialog` as a single primitive at that point. Don't pre-install.

---

## Current state

| Item | Status |
|---|---|
| Project scaffold (MERN + Vite, concurrently) | ✅ Done |
| Habits prototype (proved MERN connection works) | ✅ Done — but will be replaced |
| Everything else | ⏳ Not started |

> **Note on the existing Habit code:** `server/models/Habit.js` and `server/routes/habits.js` are a learning prototype — they proved the stack works end-to-end. They will be replaced when we reach the Habits phase. The model is wrong for production (no `userId`, wrong `frequency` type, no `HabitLog` collection). `client/src/App.jsx` is also throwaway — it was proof-of-concept only.

---

## Target folder structure

### Backend — `server/`

```
server/
├── index.js              ← entry point: loads env, connects DB, starts server
├── app.js                ← Express setup: middleware + routes (importable for testing)
├── config/
│   └── db.js             ← MongoDB connection (mongoose.connect)
├── controllers/          ← handle req/res, validate input, call services
│   ├── auth.controller.js
│   ├── habits.controller.js
│   ├── goals.controller.js
│   ├── tasks.controller.js
│   ├── reflections.controller.js
│   └── dashboard.controller.js
├── services/             ← pure business logic, no req/res, independently testable
│   ├── auth.service.js
│   ├── habits.service.js
│   ├── goals.service.js
│   ├── tasks.service.js
│   ├── reflections.service.js
│   └── dashboard.service.js
├── models/
│   ├── User.js           ← email, passwordHash, name, loginCount
│   ├── CheckIn.js        ← userId, date (one per user per day)
│   ├── Habit.js          ← userId, name, targetFrequency (number), description, status
│   ├── HabitLog.js       ← habitId, userId, date, done
│   ├── Goal.js           ← userId, title, description, deadline, status
│   ├── Milestone.js      ← goalId, title, done
│   ├── Task.js           ← userId, goalId (optional), title, dueDate, done
│   └── Reflection.js     ← userId, date, daySummary, accomplishments, win, timeWasters, improvement, focusScore
├── routes/               ← URL + method mapping only, calls controllers
│   ├── auth.routes.js
│   ├── habits.routes.js
│   ├── goals.routes.js
│   ├── tasks.routes.js
│   ├── reflections.routes.js
│   └── dashboard.routes.js
├── middleware/
│   └── auth.js           ← protect() — verifies JWT, attaches req.user
├── package.json
└── .env
```

**Layer responsibilities:**
- **Route** — maps `METHOD /path` to a controller function. Nothing else.
- **Controller** — reads `req`, validates input, calls the service, sends `res`.
- **Service** — pure business logic. Takes plain data, returns plain data. No `req` or `res`.
- **Model** — Mongoose schema. Defines shape and DB-level constraints.

All routes under `/api/*` (except `/api/auth`) use the `protect` middleware. Every query filters by `req.user._id` — no user can touch another user's data.

### Frontend — `client/src/`

```
client/src/
├── main.tsx              ← React root, wraps app in Router + QueryClientProvider
├── App.tsx               ← route definitions (React Router)
├── pages/                ← one file per screen, thin — fetch data, pass to components
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── GoalsPage.tsx
│   ├── HabitsPage.tsx
│   ├── ReflectionsPage.tsx
│   └── SettingsPage.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         ← shared nav (logo, links, active state)
│   │   └── ProtectedLayout.tsx ← wraps auth-required pages, redirects if not logged in
│   └── ui/                     ← shared primitives (Button, Input, Badge, etc.)
├── hooks/                ← custom React hooks (useAuth, etc.)
├── store/                ← Zustand stores (auth state, theme)
│   └── auth.store.ts
├── services/             ← raw API call functions (used by TanStack Query hooks)
│   └── auth.service.ts
├── lib/
│   └── api.ts            ← base fetch wrapper — attaches Authorization header
├── types/
│   └── index.ts          ← shared TypeScript interfaces (User, Habit, Goal, etc.)
└── constants/
    └── quotes.ts         ← motivational quotes array (cycled by loginCount)
```

**Layer responsibilities:**
- **Page** — fetches data via TanStack Query, passes it to components.
- **Component** — renders UI, emits events up. No direct API calls.
- **Service** — raw fetch functions called by TanStack Query. One file per resource.
- **Store** — Zustand. Auth user and theme only. Everything else lives in TanStack Query cache.
- **lib/api.ts** — the only place that reads the JWT from storage and attaches it to requests.

---

## Phases

### Phase 1 — Foundation: Auth + Frontend Setup
**Weekends:** 3 × (June 21–22, June 28–29, July 5–6)  
**Goal:** Users can sign up, log in, and be protected by auth. TypeScript and Tailwind are in place before any UI work.

#### Weekend 1 — June 21–22
**Frontend setup**
- [ ] Add TypeScript to the Vite client (`tsc`, `@types/react`, `@types/react-dom`)
- [ ] Convert existing `.jsx` files to `.tsx`
- [ ] Add Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`, configure `tailwind.config.ts`)
- [ ] Verify dev server still runs

**Why first:** CLAUDE.md rule — TypeScript and Tailwind must be in place before component work begins.

#### Weekend 2 — June 28–29
**Backend: Auth**
- [ ] `User` model — `email`, `passwordHash`, `name`, `loginCount`, `createdAt`
- [ ] `POST /api/auth/signup` — validate, hash password (bcrypt), return JWT
- [ ] `POST /api/auth/login` — verify password, return JWT, auto-record check-in
- [ ] `POST /api/auth/logout` — clear token
- [ ] `GET /api/auth/me` — return current user from token
- [ ] `CheckIn` model + auto check-in on login (one per day, builds streak)
- [ ] JWT middleware (`protect`) — attach `req.user` to all protected routes

**Why this weekend:** Auth must come before all other features — every route needs `req.user`.

#### Weekend 3 — July 5–6
**Frontend: Auth UI**
- [ ] Set up React Router — routes for `/auth`, `/` (protected), etc.
- [ ] Login screen (matches Paper design)
- [ ] Signup screen with confirm password (matches Paper design)
- [ ] Store JWT (localStorage for now, httpOnly cookie later)
- [ ] `useAuth` hook — current user, login, logout
- [ ] Protected route wrapper — redirect to `/auth` if not logged in
- [ ] Motivational quote on auth screens (hardcoded array, cycle by `loginCount`)
- [ ] "Forgot password?" link visible on login screen — non-functional in Phase 1 (deferred to Phase 2)

---

### Phase 2 — Core Data: Goals, Habits (complete), Tasks
**Weekends:** 4 × (July 12–13, July 19–20, July 26–27, Aug 2–3)  
**Goal:** All three main data features work end-to-end — backend + UI.

#### Weekend 4 — July 12–13
**Backend: Goals + Milestones**
- [ ] `Goal` model — `userId`, `title`, `description`, `deadline`, `status`, `createdAt`
- [ ] `Milestone` model — `goalId`, `title`, `done`
- [ ] `GET /api/goals` — all goals for current user
- [ ] `POST /api/goals` — create goal
- [ ] `PATCH /api/goals/:id` — update goal (title, description, deadline, status)
- [ ] `DELETE /api/goals/:id`
- [ ] `POST /api/goals/:id/milestones` — add milestone
- [ ] `PATCH /api/goals/:id/milestones/:mid` — toggle milestone done
- [ ] `DELETE /api/goals/:id/milestones/:mid`
- [ ] Progress % calculated server-side: `completed ÷ total milestones`

#### Weekend 5 — July 19–20
**Frontend: Goals screen**
- [ ] Fetch and display goals (ON TRACK / AT RISK / Completed filter tabs)
- [ ] Goal card — title, deadline, progress bar, milestone list
- [ ] Create goal modal — title, description, deadline
- [ ] Add/check off/delete milestones inline on the card
- [ ] Delete goal

#### Weekend 6 — July 26–27
**Backend + Frontend: Habits (complete)**

Backend (CRUD is done — only new pieces):
- [ ] `HabitLog` model — `habitId`, `userId`, `date`, `done`
- [ ] `PATCH /api/habits/:id/log` — mark a specific date done/not-done for current week
- [ ] Streak logic — consecutive weeks where user met `targetFrequency`
- [ ] `GET /api/habits` — include this week's logs + current streak per habit

Frontend:
- [ ] Habits screen UI (matches Paper design — weekly grid, streaks, completion stats)
- [ ] Click a day circle to toggle done/not-done (calls log endpoint)
- [ ] Create habit modal — name, frequency, description
- [ ] Delete habit

#### Weekend 7 — Aug 2–3
**Backend + Frontend: Tasks**
- [ ] `Task` model — `userId`, `goalId` (optional), `title`, `dueDate` (optional), `done`, `createdAt`
- [ ] `GET /api/tasks` — all tasks for user
- [ ] `POST /api/tasks` — create task
- [ ] `PATCH /api/tasks/:id` — toggle done, update fields
- [ ] `DELETE /api/tasks/:id`
- [ ] Tasks screen UI — list with done/undone, due date, linked goal badge
- [ ] Create task modal — title, due date, optional goal link (dropdown)

---

### Phase 3 — Dashboard + Reflections
**Weekends:** 3 × (Aug 9–10, Aug 16–17, Aug 23–24)  
**Goal:** The daily loop works end-to-end — log in, see everything, act without navigating away.

#### Weekend 8 — Aug 9–10
**Backend: Dashboard API**
- [ ] `GET /api/dashboard` — single endpoint returning:
  - Current streak (from CheckIn records)
  - Active goals with progress % and ON TRACK / AT RISK status
  - Today's tasks (due today or no due date, not done)
  - This week's habit completion grid for all active habits
- [ ] ON TRACK / AT RISK logic: AT RISK if deadline < 2 weeks away and progress < 50%, or deadline < 1 week and progress < 80%

#### Weekend 9 — Aug 16–17
**Frontend: Dashboard screen**
- [ ] Wire up dashboard API to Dashboard UI (matches Paper design)
- [ ] Mark habit days directly from dashboard
- [ ] Tick off tasks directly from dashboard
- [ ] Motivational quote — hardcoded array, cycled by `loginCount % quotes.length`
- [ ] Streak counter in header (🔥 N day streak)

#### Weekend 10 — Aug 23–24
**Backend + Frontend: Reflections**
- [ ] `Reflection` model — `userId`, `date`, `daySummary`, `accomplishments`, `win`, `timeWasters`, `improvement`, `focusScore`
- [ ] `GET /api/reflections` — all reflections, most recent first
- [ ] `POST /api/reflections` — create (one per calendar day)
- [ ] `PATCH /api/reflections/:id` — edit same-day reflection
- [ ] Reflections screen UI (matches Paper design — 6 fields, history panel)
- [ ] "View all" modal — full list with individual entry detail view

---

### Phase 4 — Settings + Polish
**Weekends:** 3 × (Aug 30–31, Sep 6–7, Sep 13–14)  
**Goal:** App is complete, feels polished, ready to deploy.

#### Weekend 11 — Aug 30–31
**Backend + Frontend: Settings**
- [ ] `PATCH /api/users/email` — update email (requires password confirmation)
- [ ] `PATCH /api/users/password` — change password (requires current password)
- [ ] Settings screen UI — Theme toggle (light/dark), email change, password change
- [ ] Dark mode — Tailwind `dark:` classes, store preference in localStorage

#### Weekend 12 — Sep 6–7
**Polish — backend**
- [ ] Input validation on all routes (express-validator or zod)
- [ ] Consistent error shape: `{ error: { code, message } }`
- [ ] Rate limiting on auth routes
- [ ] Attach `userId` filter to every query (data isolation audit)
- [ ] Basic request logging (morgan)

**Polish — frontend**
- [ ] Empty states on every screen (no goals yet, no habits, etc.)
- [ ] Loading states and error handling for all API calls
- [ ] Form validation feedback (inline errors)
- [ ] Google OAuth button (wired up — backend Passport.js strategy)

#### Weekend 13 — Sep 13–14
**Deploy**
- [ ] Choose hosting: Railway or Render for backend, Vercel for frontend
- [ ] Set environment variables (`MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID/SECRET`)
- [ ] Configure CORS for production domain
- [ ] MongoDB Atlas — production cluster
- [ ] Deploy backend, deploy frontend, verify end-to-end in production
- [ ] Update README with live URL

---

## Timeline summary

| Phase | Weekends | Dates | Deliverable |
|---|---|---|---|
| 1 — Foundation | 3 | Jun 21 – Jul 6 | Auth works, TypeScript + Tailwind in place |
| 2 — Core data | 4 | Jul 12 – Aug 3 | Goals, Habits, Tasks all work end-to-end |
| 3 — Dashboard + Reflections | 3 | Aug 9 – Aug 24 | Daily loop complete |
| 4 — Settings + Polish + Deploy | 3 | Aug 30 – Sep 14 | MVP live |
| **Total** | **13 weekends** | **Jun 21 – Sep 14** | **Shipped** |

---

## Dependencies (what blocks what)

```
TypeScript + Tailwind  ──→  all frontend work
Auth backend           ──→  all other backend routes (need req.user)
Auth frontend          ──→  all other screens (need login to test)
Goals backend          ──→  Goals frontend, Tasks backend (goalId FK)
Habits backend         ──→  Habits frontend
Tasks backend          ──→  Tasks frontend, Dashboard API
Dashboard API          ──→  Dashboard frontend
Reflections backend    ──→  Reflections frontend
```

---

## Notes

- **Habits backend is done** — Weekend 6 only needs the frontend (weekly grid UI, toggle, create/delete).
- **Auth is already in progress** — Weekend 2 may finish faster than estimated.
- **Buffer is built in** — 13 weekends to September leaves room for life happening. If a weekend is missed, the September target still holds.
- **Google OAuth** — deferred to polish phase. Email/password auth ships first; Google is additive.
- **Forgot password** — deferred to Phase 2. Requires email sending (reset link via a mail service like Resend or SendGrid). Link is visible on the login screen in Phase 1 but non-functional.
- **TypeScript strictness** — start with `"strict": false` if needed; tighten later. Don't let the type system block momentum.
- **Dark mode** — design is done in Paper. Implementation uses Tailwind `dark:` variant + a class toggle on `<html>`. Keep it for Settings weekend.
