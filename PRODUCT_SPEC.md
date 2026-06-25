# Cadence — Product Specification

**Version:** 1.0  
**Author:** Saif Ansari  
**Date:** 2026-06-14  
**Status:** Draft

---

## Audience

**Primary reader:** The builder (Saif) and any future contributors or collaborators.  
**After reading this, you will be able to:** Understand what Cadence is, why it exists, what it does in its first version, and how each feature is expected to behave — well enough to design, build, and test it.

---

## 1. Definition — What & Why

### What is Cadence?

Cadence is a personal habit and goal tracking web app. It gives users one place to set goals, build habits, manage daily tasks, and reflect on their progress.

### Why does it exist?

Most people who try to improve themselves face the same three failures:

1. **Goals that never get done.** They set a goal, get excited, then lose sight of it because there's no system to track progress or break it into smaller steps.
2. **Habits that don't stick.** They start a new habit, do it for a few days, then drop it because there's no feedback loop.
3. **No visibility into where time goes.** They feel busy but unproductive because they have no record of how much time was spent on distractions versus meaningful work.

Existing tools solve one of these problems in isolation. No single app ties them together with a clear picture of consistency, progress, and wasted time. Cadence is built to solve all three.

### What this document covers

- Feature specifications for Cadence version 1 (MVP)
- Data models, user flows, and UI screens
- Non-functional requirements

### What this document does NOT cover

- Backend implementation details (covered in engineering docs)
- Deployment and infrastructure
- Post-MVP features (noted under Open Questions)

---

## 2. Target Users

### Primary user (MVP)

**Name:** Saif (and people like him)  
**Situation:** Motivated but disorganised. Sets goals but doesn't finish them. Starts habits but doesn't sustain them. Suspects time is being wasted but has no data to prove it.  
**Goal:** Build a reliable personal system for consistency and progress.  
**Tech comfort:** High — comfortable with a web app, doesn't need hand-holding.

### Future users (post-MVP)

The app may be opened to other users in the future. Auth and multi-user data isolation are built in from day one to support this without rework.

---

## 3. Goals & Non-Goals

### Goals (product goals, not the feature)

- Give users visibility into their habits, goals, and time — all in one place
- Build a feedback loop that reinforces consistency
- Keep the UI fast and low-friction — checking in should take seconds, not minutes
- Architect for multi-user from day one, even if only one person uses it initially

### Non-Goals (for version 1)

- Metrics screen (charts, historical data, trends) — Phase 2
- Focus Score dashboard widget — Phase 2
- Time Wasters as a standalone tracked feature — Phase 2
- Habit scheduling (specific days of the week per habit) — Phase 2
- Habit pausing / archiving — Phase 2
- Notifications or reminders — Phase 2
- Linking habits directly to goals (they exist independently; connection is conceptual)
- Social features, sharing, or leaderboards
- Mobile app (web only for now)
- AI-generated insights

---

## 4. Feature Specifications

### 4.1 Authentication

The app requires login even for personal use. This enforces multi-user data isolation from day one.

**Flows:**
- Sign up with email + password
- Log in with email + password
- Continue with Google (OAuth SSO)
- Log out
- All data is scoped to the authenticated user — no user can see another user's data

**SSO:** Google is supported in Phase 1. The auth screen is built to accommodate additional providers (GitHub, Apple, etc.) in future phases — the "or" divider and SSO button slot are already part of the design.

**Auth screen design:** The screen is split — left panel (teal) carries the product tagline and a motivational quote; right panel carries the form. The quote grounds the user's intention each time they open the app.

**Technical note:** JWT-based auth for email/password. Google OAuth handled via OAuth 2.0 callback flow (provider to be integrated server-side — e.g. Passport.js). Tokens stored in httpOnly cookies or localStorage (to be decided in engineering).

---

### 4.2 Habits

A habit is a recurring behaviour the user wants to build into their life. The goal is not perfection — it is consistency until the behaviour becomes automatic.

#### Creating a habit

| Field | Type | Notes |
|---|---|---|
| Name | Text | e.g. "Read 10 minutes", "Go to gym" |
| Target frequency | Number | How many days per week the user aims to do it (e.g. 3–5) |
| Description | Text (optional) | Why this habit matters |

#### Tracking a habit

- Each week, the user marks each day as **done** or **not done**
- A simple weekly grid: Mon Tue Wed Thu Fri Sat Sun — tap to mark
- No time pressure — the user can log a past day within the same week

#### Habit metrics

| Metric | Description |
|---|---|
| Weekly completion rate | Days done ÷ target days that week |
| Monthly completion rate | Across all weeks in the month |
| Annual completion rate | Across all weeks in the year |
| Current streak | Consecutive weeks meeting the target frequency |
| Longest streak | All-time best streak |

#### Habit states

- **Active** — being tracked
- **Completed** — user marks it done when the habit no longer needs a tracker (it's become natural)

---

### 4.3 Goals

A goal is a meaningful objective with a defined outcome and a deadline. Think of it as a project.

**Examples:**
- "Learn backend development" — deadline: 3 months
- "Earn $100,000" — deadline: end of year
- "Read 12 books" — deadline: December 31

#### Creating a goal

| Field | Type | Notes |
|---|---|---|
| Title | Text | e.g. "Learn backend development" |
| Description | Text (optional) | More context on what this means |
| Deadline | Date | When the goal should be completed by |
| Tasks | List (optional) | Tasks can be added in the same modal — the goal is created first, then each task is created with the returned goalId |

#### Progress

A goal's progress is calculated from its linked tasks: `completed tasks ÷ total tasks linked to the goal`.

Goals with no tasks show 0% until tasks are added. Goals can be manually marked complete regardless of task progress.

#### Goal states

| State | Meaning |
|---|---|
| Active | In progress, deadline not passed |
| Completed | User manually marks it done |
| Overdue | Deadline has passed and goal is not completed |

#### Notes on habits and goals

Habits and goals are independent. A user may have a habit of "reading 30 minutes daily" and a goal of "finish 5 books" — they are related conceptually but not technically linked in version 1.

---

### 4.4 Tasks

A task is a discrete, completable action. Tasks can exist on their own or be linked to a goal — neither is required.

#### Creating a task

| Field | Type | Notes |
|---|---|---|
| Title | Text | e.g. "Set up FastAPI project" |
| Linked goal | Goal (optional) | Associates the task with a goal for context |
| Due date | Date (optional) | When it should be done |

#### Behaviour

- Tasks appear in the "TODAY" panel on the dashboard when they are due today or have no due date
- Marking a task complete removes it from the today view
- Tasks linked to a goal show under that goal on the Goals screen as well
- No task is required to be part of a goal — standalone tasks are first-class

#### Task states

- **Pending** — not yet done
- **Completed** — marked done by the user

---

### 4.5 Check-in (Auto)

The check-in is automatic — no button required. When the user logs in on a given day, that day is marked as a check-in. The streak increments once per calendar day.

#### Behaviour

- Triggered automatically on login
- One check-in per calendar day, regardless of how many times the user logs in
- Builds a streak: consecutive calendar days where the user logged in
- **Streak resets to 0 if the user does not log in on a given day** — no grace period in v1
- Streak counter shown prominently in the dashboard header (e.g. "🔥 12 day streak")

#### Streak rules (v1)

- Streak increments when the user logs in on a day they haven't yet checked in
- Missing a day resets the streak to 0
- Pausing the streak is a post-MVP feature (with restrictions to be defined)

This keeps attendance frictionless. The richer daily reflection lives in Reflections (see 4.6).

---

### 4.6 Reflections

Reflections is an optional end-of-day form the user fills in to look back on the day. It is separate from the auto check-in — the check-in records presence, Reflections records depth.

#### Fields

| Field | Type | Notes |
|---|---|---|
| Overall, how was your day? | Long text | General summary / overview |
| What did you accomplish? | Long text | What got done |
| Win of the day | Short text | One highlight — big or small |
| What did you waste time on? | Long text | Distractions and time sinks |
| What can be improved? | Long text | One thing to do differently |
| How focused were you today? | Number (1–10) | Manually selected by the user |

#### Behaviour

- Optional — not required every day
- One entry per calendar day (edit if already filled in that day)
- All fields are optional within the form — fill in whatever is relevant that day
- A list of all past reflections is shown alongside the form, most recent first
- Each entry in the list shows the date and a preview of the day summary

---

### 4.7 Dashboard

The dashboard is the home screen. It gives the user a snapshot of everything without requiring them to navigate elsewhere.

#### Sections

| Section | Content |
|---|---|
| Streak | Consecutive login days — auto-updated on login, shown in header |
| Motivational quote | A brief, powerful quote — a daily anchor. Chosen to reinforce the user's intent. |
| Goals | Active goals with progress % and ON TRACK / AT RISK status |
| Today's Tasks | Tasks due today or without a due date — check off without leaving dashboard |
| What Matters Most | Highest-priority tasks linked to active goals |
| Habits | Active habits with this week's completion grid |

The dashboard is read + act: the user can mark habit days, tick off tasks, and see their goal progress without navigating away.

---

### 4.8 Settings

| Setting | Options |
|---|---|
| Theme | Light / Dark |
| Account | Change email, change password |

---

## 5. User Flows

### New user flow
```
Sign up → Dashboard (empty state with prompts to add first habit / goal) → Add habit → Add goal → Add tasks
```

### Daily flow
```
Log in (auto check-in recorded) → Dashboard → Mark today's tasks done → Mark habit days → (evening) Fill in Reflections
```

### Weekly reflection flow
```
Open app → Reflections → Browse past entries → Review goal progress on Goals screen
```

### Goal completion flow
```
Goals screen → Open goal → Mark all tasks done → Mark goal as "Completed"
```

---

## 6. Data Models (high level)

| Model | Key fields |
|---|---|
| User | id, email, passwordHash, createdAt |
| Habit | id, userId, name, targetFrequency, description, status, createdAt |
| HabitLog | id, habitId, userId, date, done |
| Goal | id, userId, title, description, deadline, status, createdAt |
| Task | id, userId, goalId (optional), title, dueDate (optional), done, createdAt |
| CheckIn | id, userId, date (auto-created on login, one per day) |
| Reflection | id, userId, date, daySummary, accomplishments, win, timeWasters, improvement, focusScore (1–10) |

---

## 7. Screens (v1)

| Screen | Route | Purpose |
|---|---|---|
| Login / Sign up | `/auth` | Authentication |
| Dashboard | `/` | Daily overview — streak, goals, tasks, habits |
| Habits | `/habits` | Manage and track habits |
| Goals | `/goals` | Manage goals and their linked tasks |
| Reflections | `/reflections` | Daily reflection form + full history list |
| Settings | `/settings` | Theme toggle, account |

Light and dark variants for all screens.

---

## 8. Functional Requirements

What the system must be able to do in Phase 1.

### Authentication
- A user must be able to register with an email address and password
- A user must be able to log in with email and password
- A user must be able to log in via Google SSO (OAuth 2.0)
- A user must be able to log out
- A user must not be able to access another user's data
- The system must automatically record a check-in on the user's first login of each calendar day

### Goals
- A user must be able to create a goal with a title, optional description, and deadline
- A user must be able to add tasks to a goal from the same creation modal (goal created first, tasks use the returned goalId)
- Goal progress must be calculated automatically: completed tasks ÷ total tasks linked to the goal
- A goal with no tasks shows 0% and can be manually marked complete
- A user must be able to view goals filtered by status: All, On Track, At Risk, Completed
- A user must be able to edit and delete a goal
- Deleting a goal unlinks its tasks — tasks are kept as standalone (not deleted)

### Habits
- A user must be able to create a habit with a name, target frequency (days per week), and optional description
- A user must be able to mark any day of the current week as done or not done for a habit
- A user must be able to mark a past day within the same week
- The system must track the habit streak: consecutive weeks where the user met the target frequency
- A user must be able to mark a habit as completed when it no longer needs tracking

### Tasks
- A user must be able to create a task with a title, optional due date, and optional link to a goal
- A user must be able to mark a task as done
- Tasks due today, or with no due date, must appear in the dashboard's today view
- Tasks linked to a goal must also appear on that goal's detail view
- A user must be able to edit and delete a task

### Check-in (Auto)
- The system must create exactly one check-in record per user per calendar day, triggered on login
- The login streak must increment on the first login of each new day
- The streak must reset to 0 if the user does not log in on a given calendar day

### Reflections
- A user must be able to create one reflection per calendar day
- A user must be able to edit that day's reflection if submitted earlier in the day
- The reflection form must include: day summary, accomplishments, win of the day, time wasters, what can be improved, focus score (1–10)
- All fields must be optional — partial submissions are valid
- A user must be able to view a list of all past reflections, most recent first

### Dashboard
- The dashboard must show the user's current login streak
- The dashboard must show all active goals with progress percentage
- The dashboard must show today's tasks (due today or no due date)
- The dashboard must show the current week's habit completion grid for all active habits

### Settings
- A user must be able to switch between light and dark mode
- A user must be able to update their email address
- A user must be able to update their password

---

## 9. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| Auth | JWT-based, multi-user data isolation enforced at API level |
| Performance | Page loads under 2 seconds on standard broadband |
| Reliability | No data loss — every log entry is persisted immediately |
| Security | Passwords hashed (bcrypt), no plaintext secrets, input validated server-side |
| Scalability | MongoDB schema designed to support many users, not just one |
| Observability | Basic server logging for errors and API requests |
| Responsive design | Desktop-first (1440px) in Phase 1 — mobile/tablet support deferred to Phase 2 |

---

## 10. Phases

### Phase 1 — Current (MVP)

The core loop. Everything needed to use the app daily.

| # | Feature | Description |
|---|---|---|
| 1 | Auth | Signup, login, logout. Auto check-in + streak on login |
| 2 | Goals | CRUD + task-based progress % |
| 3 | Habits | CRUD + daily check-off + weekly grid |
| 4 | Tasks | CRUD + optional goal link + today view on dashboard |
| 5 | Dashboard | Streak, goals, today's tasks, habits |
| 6 | Reflections | Simple form (6 fields) + full history list |
| 7 | Settings | Theme toggle + account (email, password) |

### Phase 2 — Planned

Add depth once the core loop is working and being used daily.

| Feature | Description |
|---|---|
| Metrics | Charts for habit completion, goal progress, streak history — weekly / monthly / annual |
| Focus Score widget | Display focus score trend on dashboard, sourced from Reflections |
| Time Wasters (structured) | Dedicated logging with activity + duration; shown in Metrics |
| Habit scheduling | Set specific days of the week per habit |
| Habit pause | Temporarily pause a habit without breaking data continuity |
| Streak pause | Pause streak with defined restrictions (to be designed) |
| Notifications | Daily reminder to fill in Reflections |
| Habit → Goal linking | Explicitly associate a habit with a goal |
| Responsive design | Mobile and tablet layouts for all screens |
| Additional SSO providers | GitHub, Apple, or others (Google is Phase 1) |

### Phase 3 — Future

To be defined once Phase 2 is complete and the app is being used daily.

---

## 11. Open Questions

| Question | Owner | Priority |
|---|---|---|
| Tasks — should completed tasks be archived or permanently deleted? | Saif | Low |
| Habit pause — should it come in Phase 1 or Phase 2? | Saif | Medium |
| Streak pause — what are the restrictions? (max pauses/month, requires reason, etc.) | Saif | Phase 2 |

*Resolved: Focus score is manually input 1–10 via Reflections (not calculated). Check-in is auto on login (no button). Time wasters are free-text in Reflections in Phase 1, structured feature in Phase 2. Tasks are standalone or optionally linked to a goal. Metrics and Focus Score widget are Phase 2.*

---

*This is a living document. Update it when scope changes, open questions are resolved, or new phases are defined.*
