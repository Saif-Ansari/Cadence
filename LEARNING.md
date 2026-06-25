# Cadence — Backend Learning Notes

This doc grows as we build. Every concept gets explained here — not just what it is,
but why it exists and what breaks without it.

---

## 1. Folder Architecture — Routes, Controllers, Services

Every feature follows the same three-layer pattern:

```
routes/auth.routes.js          → "POST /signup goes to authController.signup"
controllers/auth.controller.js → reads req, validates, calls service, sends res
services/auth.service.js       → pure business logic — no req, no res
```

**What each layer is allowed to touch:**

| Layer | Knows about | Does NOT touch |
|---|---|---|
| Route | URL + HTTP method | Nothing else |
| Controller | `req`, `res`, `next` | Database directly |
| Service | Models, DB queries | `req`, `res` |
| Model | MongoDB schema | HTTP, services |

**Other folders:**

- `config/db.js` — MongoDB connection. Extracted from `index.js` so it can be reused or mocked in tests.
- `app.js` — Express setup (middleware + routes). Separated from `index.js` so you can import the app without starting the server (useful for testing with supertest).
- `index.js` — just connects the DB and calls `app.listen`. Nothing else.

---

## 2. Architecture Decisions — Why These Choices

### The core principle

Every architecture decision in this project comes down to one idea:

> **Separate things that change for different reasons. Make each piece ignorant of what it doesn't need to know.**

Each layer has a different *reason to change*:
- Route changes when the URL changes
- Controller changes when the API contract changes
- Service changes when the business rule changes

If these are in the same function, changing a business rule means touching the
same code that handles HTTP. You can break the API while fixing logic, or break
logic while changing the API. Separated, a change in one layer can't affect another.

When a new developer needs to fix a bug in login — they follow the chain:
`routes → controller → service`. Three files, three minutes, zero guessing.

### Why the service has no `req` or `res`

HTTP is just one way to trigger business logic. The service gets called from a
controller today. Tomorrow it could be called from:
- A test file (no server running)
- An admin CLI script
- A scheduled cron job

If the service needed `req` and `res`, none of those would work. Keeping HTTP
out of the service makes the business logic independent of *how* it's triggered.

### Why `app.js` is separate from `index.js`

`app.listen()` is a side effect — it binds to a port. `app.js` has no side effects,
it just builds and exports the Express app.

This matters for testing: you can import `app.js` and fire requests against it
in memory without a port being occupied:

```js
const app = require('./app')
const request = require('supertest')
request(app).post('/api/auth/signup').send({...}) // no server needed
```

`index.js` is the only file with side effects. You only run it when you actually
want to start the server.

### Why MongoDB over SQL (PostgreSQL, MySQL)

SQL databases use fixed-column tables. To add a new field you write a migration
— a script that alters the table, which can be risky on live data.

MongoDB stores JSON documents. You can add a new field to your User model today
and old documents without that field still work. No migration needed.

For this project that matters because:
- You're iterating fast — the schema will change as features are built
- The data maps naturally to JSON (what React sends and receives)
- No impedance mismatch between API responses and DB documents

**The trade-off:** MongoDB doesn't enforce relationships like SQL foreign keys.
If you delete a User, their Habits and Goals don't automatically delete — you
handle that in the service layer. Acceptable here because we control all the code.

### Why JWT over sessions

Sessions store state on the server — a record per logged-in user in a DB or Redis.
Every request the client sends a session ID, the server looks it up.

JWT is stateless — the server signs a token on login, the client sends it with
every request, the server verifies the signature. No DB lookup per request.

| | Sessions | JWT |
|---|---|---|
| Server stores state | Yes | No |
| DB lookup per request | Yes | No |
| Scales horizontally | Hard — all servers need shared session store | Easy — any server can verify |
| Logout | Easy — delete the session | Harder — token valid until expiry |

For Cadence: JWT is right. Less infrastructure, stateless, scales without a
session store. The logout trade-off is acceptable — tokens expire in 7 days and
we'll move to httpOnly cookies before deploying.

### Why bcrypt over MD5 or SHA-256

MD5 and SHA-256 are designed to be *fast*. A GPU can compute billions of SHA-256
hashes per second — an attacker with a leaked DB can brute-force common passwords
in minutes.

bcrypt is designed to be *slow*. 10 rounds = ~100ms per hash. Imperceptible to a
user logging in. For an attacker trying millions of passwords, the difference is
between minutes and years.

bcrypt also generates a unique random salt per password automatically. Two users
with the same password get completely different hashes. Pre-computed rainbow tables
are useless.

---

## 2. The Big Picture — How the Stack Fits Together

```
Browser (React)
     │
     │  HTTP requests (fetch / TanStack Query)
     ▼
Vite dev server  ──proxy /api──►  Express server (port 5000)
(port 5173)                              │
                                         │  Mongoose (ODM)
                                         ▼
                                      MongoDB
                                   (local / Atlas)
```

**What each layer does:**

| Layer | Role |
|---|---|
| React (client) | What the user sees and interacts with |
| Vite proxy | In development, forwards `/api` requests to Express so you don't deal with CORS |
| Express | Receives HTTP requests, runs middleware, calls the right route handler, returns JSON |
| Mongoose | Translates between JavaScript objects and MongoDB documents |
| MongoDB | Stores the actual data as JSON-like documents in collections |

**The request lifecycle — what happens when you call `POST /api/auth/login`:**

```
1. React calls fetch('/api/auth/login', { method: 'POST', body: ... })
2. Vite forwards the request to http://localhost:5000/api/auth/login
3. Express receives it and runs global middleware (cors, express.json)
4. express.json() parses the request body from raw bytes into req.body
5. Express matches the route — POST /api/auth → auth router → /login handler
6. The handler runs: find user, compare password, sign token, send response
7. Express sends back JSON: { token, user }
8. React receives the response and stores the token
```

---

## 2. Express — The HTTP Layer

Express is a minimal web framework for Node.js. It does three things:

1. **Routing** — maps `METHOD /path` to a handler function
2. **Middleware** — runs functions in a chain before the handler
3. **Response** — sends data back to the client

### Routing

```js
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})
```

`req` = the incoming request (body, headers, params, query string)
`res` = the outgoing response (what you send back)

### Express Router

When you have many routes for one resource, you extract them into a Router:

```js
// routes/auth.js
const router = express.Router()
router.post('/signup', handler)
router.post('/login', handler)

// index.js
app.use('/api/auth', authRouter)
// result: POST /api/auth/signup, POST /api/auth/login
```

This keeps `index.js` clean. Each resource has its own file.

### Middleware

Middleware is any function with the signature `(req, res, next)`.

```js
function logger(req, res, next) {
  console.log(req.method, req.path)
  next() // pass control to the next function
}

app.use(logger) // runs before every route
```

The chain looks like this:

```
Request
  → cors()          // adds CORS headers
  → express.json()  // parses body from raw text into req.body
  → logger()        // our custom middleware
  → route handler   // the actual logic
  → Response
```

If any middleware doesn't call `next()` or `res.send()`, the request hangs forever.

---

## 3. MongoDB + Mongoose

### MongoDB basics

MongoDB stores data in **collections** (like tables in SQL) made up of **documents**
(like rows, but they're JSON). There's no fixed schema — every document in a collection
can have different fields.

```
Database: cadence
  Collection: users
    Document: { _id: ObjectId("..."), name: "Saif", email: "saif@...", passwordHash: "..." }
    Document: { _id: ObjectId("..."), name: "Ali",  email: "ali@...",  passwordHash: "..." }
  Collection: habits
    Document: { _id: ObjectId("..."), userId: ObjectId("..."), name: "Read 10 mins" }
```

MongoDB auto-generates `_id` for every document — it's a unique 24-character hex string
called an **ObjectId**.

### What Mongoose adds

MongoDB itself doesn't care what shape your documents are. Mongoose adds:

- **Schema** — define the shape and types of a document
- **Validation** — `required`, `unique`, `minLength` etc. — checked before saving
- **Models** — a class that wraps a collection with methods: `find`, `create`, `updateOne`, etc.
- **Middleware** — run logic before/after save, delete, etc.

```js
// Define the shape
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }
})

// Create a model (wraps the 'users' collection)
const User = mongoose.model('User', userSchema)

// Use it
const user = await User.create({ email: 'saif@example.com' })
const found = await User.findOne({ email: 'saif@example.com' })
```

### Useful schema options

| Option | What it does |
|---|---|
| `required: true` | Mongoose rejects the save if this field is missing |
| `unique: true` | Creates a unique index in MongoDB — no two documents can have the same value |
| `trim: true` | Strips whitespace from strings before saving |
| `lowercase: true` | Converts the string to lowercase before saving |
| `default: value` | Used if the field is not provided |
| `{ timestamps: true }` | Auto-adds `createdAt` and `updatedAt` to every document |

### Refs and ObjectIds

When one document relates to another, you store its `_id`:

```js
// HabitLog document
{
  habitId: ObjectId("abc123"),  // refers to a Habit document
  userId:  ObjectId("def456"),  // refers to a User document
  date:    Date,
  done:    Boolean
}
```

In the schema:
```js
userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
```

`ref: 'User'` enables Mongoose's `populate()` — it can automatically fetch the
full User document when you query a HabitLog. We won't use this much — most queries
filter by `userId` directly.

---

## 4. Passwords — bcrypt

### Why never store a real password

If your database is leaked — a breach, a misconfigured backup, a rogue employee —
and you stored passwords as plaintext, every user's password is instantly exposed.
Worse, most people reuse passwords across sites, so you've also compromised their
email, bank, and everything else.

### What a hash is

A hash is a one-way function. You put in a password, you get out a fixed-length
string. You cannot reverse it.

```
"password123"  →  bcrypt  →  "$2b$10$abc...xyz"

You can NOT go:  "$2b$10$abc...xyz"  →  "password123"
```

When a user logs in, you hash what they typed and compare the two hashes.

### The rainbow table problem

A basic hash (SHA-256, MD5) is fast by design. Attackers pre-compute a massive
lookup table of common passwords and their hashes — called a **rainbow table**.
Given a leaked hash, they look it up and get the password in milliseconds.

### How bcrypt solves it — salts

bcrypt adds a **salt** — a random string generated per user — to the password before
hashing. The salt is stored in the resulting hash string.

```
"password123" + "xK9mQ2" (random salt)  →  bcrypt  →  "$2b$10$xK9mQ2..."
"password123" + "pL3nR7" (different salt)  →  bcrypt  →  "$2b$10$pL3nR7..."
```

Same password, different hashes every time. Rainbow tables are useless — an attacker
would need a separate table for every possible salt value.

### Salt rounds (cost factor)

The `10` in `bcrypt.hash(password, 10)` is the number of rounds (2^10 = 1024
iterations). It makes bcrypt intentionally slow — about 100ms on a modern machine.

- Fast enough for a login (nobody notices 100ms)
- Slow enough to make brute-forcing millions of passwords infeasible

```js
const passwordHash = await bcrypt.hash(password, 10)  // signup
const match = await bcrypt.compare(password, user.passwordHash)  // login
```

---

## 5. JWT — JSON Web Tokens

### The problem: HTTP is stateless

Every HTTP request is independent. The server has no memory of previous requests.
When you make a second request, the server has no idea who you are.

**Old solution: sessions**
Server stores a session for each logged-in user. Client sends a session ID cookie.
Problem: every server needs access to the session store — doesn't scale horizontally.

**Modern solution: JWT (stateless)**
After login, the server gives you a signed token. You send it with every request.
The server verifies the signature — no database lookup needed.

### What a JWT looks like

A JWT is three Base64-encoded parts joined by dots:

```
eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjY2YWJjMTIzIn0.xK9mQ2abc...
─────────────────── ──────────────────────────── ─────────────
      Header                 Payload               Signature
  (algorithm used)       (data you stored)     (proves it wasn't tampered)
```

The payload contains whatever you put in it — we store `{ id: userId }`.
The signature is computed using `JWT_SECRET`. Anyone who changes the payload
would need the secret to re-sign it, so the server can detect tampering.

**Important:** JWTs are not encrypted — the payload is just Base64, anyone can
decode it. Never put sensitive data (passwords, credit cards) in a JWT.

### How we use it

```js
// On login — create a token
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

// On every protected request — verify the token
const decoded = jwt.verify(token, process.env.JWT_SECRET)
// decoded = { id: "66abc123", iat: 1234567890, exp: 1235172690 }
```

### Why JWT_SECRET must stay secret

The secret is used to sign and verify tokens. If an attacker gets the secret,
they can forge tokens for any user. Keep it out of git, never hardcode it.

---

## 6. The protect Middleware

`protect` is the gatekeeper for every authenticated route.

```js
// Without protect — anyone can call this
router.get('/habits', (req, res) => { ... })

// With protect — only logged-in users get through
router.get('/habits', protect, (req, res) => { ... })
```

What it does:

```
Request comes in with header: Authorization: Bearer eyJhbG...
     │
     ▼
protect() reads the Authorization header
     │
     ├── No header? → 401 Unauthorized (stop here, handler never runs)
     │
     ├── jwt.verify() fails (expired / tampered)? → 401 (stop here)
     │
     └── Valid token → look up User by decoded.id → attach to req.user → next()
                                                                              │
                                                                              ▼
                                                                    Route handler runs
                                                                    req.user is available
```

`select('-passwordHash')` when fetching the user means: give me all fields except
`passwordHash`. We never need the hash after auth — no reason to carry it in memory.

---

## 7. Mongoose Methods — Quick Reference

### Method comparison

| Method | Returns | Use when |
|---|---|---|
| `find(filter)` | Array | Fetching multiple documents |
| `findOne(filter)` | Document or null | Fetching one + ownership check |
| `findById(id)` | Document or null | Fetching by `_id` only |
| `create(data)` | Created document | Inserting a new document |
| `findOneAndUpdate(filter, updates, opts)` | Updated document or null | Update + need the result back |
| `findOneAndDelete(filter)` | Deleted document or null | Delete + need to verify ownership |
| `updateOne(filter, update, opts)` | Result object | Insert or do nothing (idempotent) |
| `deleteMany(filter)` | Result object | Bulk delete (cascade cleanup) |

### `findOneAndUpdate` in depth

Takes exactly 3 arguments: `filter`, `update`, `options`.

```js
Goal.findOneAndUpdate(
  { _id: goalId, userId },            // 1. filter
  updates,                             // 2. update
  { new: true, runValidators: true }  // 3. options
)
```

**Argument 1 — filter**

The WHERE clause. Find a document where ALL conditions match:

```js
{ _id: goalId, userId }
// finds a document where _id = goalId AND userId = userId
// if either fails — returns null
```

We always include `userId` alongside `_id`. This bakes the ownership check into
the query — one operation instead of two. The caller can't tell whether the
document doesn't exist or belongs to someone else — intentional.

**Argument 2 — update**

What to change. Two ways to write it:

```js
// Plain object — Mongoose wraps in $set automatically
{ title: 'New title', status: 'completed' }

// Explicit $set — same result
{ $set: { title: 'New title', status: 'completed' } }
```

`$set` only changes the fields you specify. Other fields on the document are
untouched. Without `$set`, MongoDB would replace the entire document with just
those fields — you'd lose everything else.

**Argument 3 — options**

```js
{ new: true }
// Return the document AFTER the update
// Default is false — returns document BEFORE update
// Almost always want true

{ runValidators: true }
// Run schema validation on the update
// Default is false for updates — Mongoose only validates on .save()
// Without this, invalid enum values or wrong types slip through
```

**Return value**

```js
const goal = await Goal.findOneAndUpdate(...)
// goal = updated document  → filter matched
// goal = null              → filter didn't match (wrong id OR wrong userId)

if (!goal) {
  const err = new Error('Goal not found')
  err.status = 404
  throw err
}
```

### Similar methods — same 3-argument shape

```js
// findOneAndDelete — filter only, no update needed
Model.findOneAndDelete({ _id: id, userId })
// returns deleted document or null

// findOne — read only, no update
Model.findOne({ _id: id, userId })
// returns document or null, nothing changed

// findOneAndUpdate with other operators
Model.findOneAndUpdate(
  { _id: id, userId },
  { $inc: { loginCount: 1 } },  // increment instead of set
  { new: true }
)
```

### Common update operators

| Operator | Does |
|---|---|
| `$set` | Set specific fields (most common) |
| `$inc` | Increment a number by N |
| `$push` | Add an item to an array |
| `$pull` | Remove an item from an array |
| `$setOnInsert` | Only set fields on insert (used with upsert) |

### Ownership check pattern

Every update and delete uses this — ownership baked into the filter:

```js
// ✅ Correct — ownership checked in one atomic query
const goal = await Goal.findOneAndUpdate({ _id: goalId, userId }, updates, opts)
if (!goal) throw notFound()

// ❌ Wrong — two queries, race condition possible between them
const goal = await Goal.findById(goalId)
if (goal.userId !== userId) throw forbidden()
await Goal.findByIdAndUpdate(goalId, updates)
```

The single-query version is atomic — no window between the check and the update
where another request could interfere.

---

## 8. Habits — HabitLog, Date Normalization, Streak Logic

### Why two models instead of one

The `Habit` document stores the definition — name, target, description. It never changes when you check off a day.

Every day you mark a habit done is a separate `HabitLog` document. This keeps history clean and queryable:

```
Habit:    { name: "Read", targetFrequency: 5 }
HabitLog: { habitId, userId, date: 2026-06-21, done: true }
HabitLog: { habitId, userId, date: 2026-06-22, done: true }
```

If logs were stored as an array inside the Habit document, it would grow unboundedly and make historical queries painful.

### Date normalization — why midnight UTC

HabitLog stores a `Date`. The problem with a full timestamp like `2026-06-21T23:45:00.000Z`:
- Querying "did user log June 21?" becomes a range query (`>= midnight`, `< next midnight`)
- Two logs on the same day would have different timestamps and the unique index wouldn't catch duplicates

The fix: always normalize to midnight before saving or querying:

```js
function normalizeDate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
// 2026-06-21T23:45:00 → 2026-06-21T00:00:00.000Z
// 2026-06-21T08:00:00 → 2026-06-21T00:00:00.000Z
// Now equality check works: date === June 21 midnight
```

### Compound unique index

```js
habitLogSchema.index({ habitId: 1, userId: 1, date: 1 }, { unique: true })
```

Same pattern as CheckIn. Enforces one log per user per habit per day at the database level. Without it, a double-click on the frontend could insert two logs.

### Toggle pattern — create or delete, never update

When a user clicks a day on the habit grid:
- If no log exists for that date → create one (mark done)
- If a log exists for that date → delete it (mark not done)

This means there are no `done: false` records in the DB. Every `HabitLog` that exists means the habit was completed. Cleaner than flipping a boolean.

```js
const existing = await HabitLog.findOne({ habitId, userId, date: normalized })
if (existing) {
  await existing.deleteOne()
  return { done: false }
}
await HabitLog.create({ habitId, userId, date: normalized })
return { done: true }
```

### Streak calculation algorithm

A streak = consecutive weeks where `count of done days >= targetFrequency`.

The current week is always skipped — if today is Wednesday and your target is 5, you've only had 3 days. Breaking the streak here would be wrong.

```
1. Group all logs by week (use the Monday of each week as the key)
2. Start from last week, walk backwards
3. Each week: count done days
4. If count >= targetFrequency → streak++, go back another week
5. If count < targetFrequency → stop
```

Finding the Monday of any date:
```js
function getMondayOf(date) {
  const d = normalizeDate(date)
  const day = d.getDay()           // 0=Sun, 1=Mon ... 6=Sat
  const diff = day === 0 ? 6 : day - 1  // Sunday needs to go back 6 days
  d.setDate(d.getDate() - diff)
  return d
}
```

### Client sends the date, server normalizes it

The toggle endpoint accepts a `date` from the request body rather than using `new Date()` server-side. Reason: a habit completed at 11:58pm but logged after midnight should be recorded for the previous day. The client knows the user's intent — the server just normalizes it to midnight and stores it.

---

## 9. CheckIn — Auto Streak Tracking

A CheckIn document records that a user logged in on a specific calendar day.

```js
// Compound unique index: userId + date must be unique together
checkInSchema.index({ userId: 1, date: 1 }, { unique: true })
```

The `upsert` pattern in the login route:

```js
await CheckIn.updateOne(
  { userId, date: today },          // find this document
  { $setOnInsert: { userId, date } }, // if inserting (not updating), set these fields
  { upsert: true }                   // create if it doesn't exist
)
```

`upsert: true` means: if the document doesn't exist, create it. If it does, do nothing
(`$setOnInsert` only runs on insert). This is one atomic operation — no race condition,
no duplicate check-ins even if the user logs in twice simultaneously.

---

## 10. What We've Built So Far

```
server/
├── index.js                      ✅ loads env, connects DB, starts server
├── app.js                        ✅ Express setup — middleware + routes
├── config/
│   └── db.js                     ✅ MongoDB connection
├── middleware/
│   └── auth.js                   ✅ protect() — JWT verification, req.user
├── models/
│   ├── User.js                   ✅ email, passwordHash, name, loginCount
│   ├── CheckIn.js                ✅ userId, date — compound unique index
│   ├── Goal.js                   ✅ userId, title, description, deadline, status
│   ├── Milestone.js              ✅ goalId, userId, title, done
│   ├── Habit.js                  ✅ userId, name, targetFrequency, description, status
│   ├── HabitLog.js               ✅ habitId, userId, date — compound unique index
│   └── Task.js                   ✅ userId, goalId (optional), title, dueDate, done
├── controllers/
│   ├── auth.controller.js        ✅ signup, login, logout, me
│   ├── goals.controller.js       ✅ CRUD + milestone endpoints
│   ├── habits.controller.js      ✅ CRUD + toggle endpoint
│   └── tasks.controller.js       ✅ CRUD + query filters
├── services/
│   ├── auth.service.js           ✅ bcrypt, JWT, CheckIn logic
│   ├── goals.service.js          ✅ goals CRUD, milestones, progress calculation
│   ├── habits.service.js         ✅ CRUD, streak logic, weekly grid
│   └── tasks.service.js          ✅ CRUD, today filter, goalId filter
└── routes/
    ├── auth.routes.js            ✅ POST /signup, /login, /logout — GET /me
    ├── goals.routes.js           ✅ CRUD + nested milestone routes
    ├── habits.routes.js          ✅ CRUD + toggle route
    └── tasks.routes.js           ✅ CRUD
```

### Endpoints live now

| Method | Path | Auth | What it does |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create account, return JWT |
| POST | `/api/auth/login` | No | Verify credentials, return JWT, record check-in |
| POST | `/api/auth/logout` | No | Client-side only — server confirms |
| GET | `/api/auth/me` | Yes | Return current user from token |
| GET | `/api/health` | No | Server alive check |
| GET | `/api/goals` | Yes | All goals with milestones + progress % |
| POST | `/api/goals` | Yes | Create goal |
| PATCH | `/api/goals/:id` | Yes | Update goal |
| DELETE | `/api/goals/:id` | Yes | Delete goal + cascade delete milestones |
| POST | `/api/goals/:id/milestones` | Yes | Add milestone |
| PATCH | `/api/goals/:id/milestones/:mid` | Yes | Toggle milestone done |
| DELETE | `/api/goals/:id/milestones/:mid` | Yes | Delete milestone |
| GET | `/api/habits` | Yes | All habits with weekGrid + streak |
| POST | `/api/habits` | Yes | Create habit |
| PATCH | `/api/habits/:id` | Yes | Update habit |
| DELETE | `/api/habits/:id` | Yes | Delete habit + cascade delete logs |
| PATCH | `/api/habits/:id/toggle` | Yes | Toggle a day done/not done |
| GET | `/api/tasks` | Yes | All tasks (filters: `?goalId=`, `?done=`, `?today=true`) |
| POST | `/api/tasks` | Yes | Create task |
| PATCH | `/api/tasks/:id` | Yes | Update task (toggle done, edit fields) |
| DELETE | `/api/tasks/:id` | Yes | Delete task |

---

## 11. What's Next

```
Backend remaining:
  └── Dashboard API — streak, goals, tasks, habits in one endpoint

Frontend (all pages):
  ├── Goals screen
  ├── Habits screen
  ├── Tasks screen
  ├── Dashboard full UI
  ├── Reflections
  └── Settings
```

---

*This document is updated as we build. Concepts are explained once — refer back here
before asking "why does this work?"*
