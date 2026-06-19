# Cadence — Backend Learning Notes

This doc grows as we build. Every concept gets explained here — not just what it is,
but why it exists and what breaks without it.

---

## 1. Folder Architecture — Routes, Controllers, Services

Every feature follows the same three-layer pattern:

```
routes/auth.routes.js       → "POST /signup goes to authController.signup"
controllers/auth.controller.js → reads req, validates, calls service, sends res
services/auth.service.js    → pure business logic — no req, no res
```

**Why split it this way?**

The controller knows about HTTP. The service does not.

This matters because a service function is just a regular JavaScript function:

```js
// Service — takes plain data, returns plain data
const result = await authService.signup('Saif', 'saif@example.com', 'password123')

// You can call this from:
// - A controller (HTTP request)
// - A test file (no server needed)
// - A CLI script
// - A cron job
```

If you put the business logic directly in the route handler, you can only test it
by simulating an HTTP request. Separate it into a service and you can test it
with a plain function call.

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

## 7. CheckIn — Auto Streak Tracking

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

## 8. What We've Built So Far

```
server/
├── index.js              ✅ wires middleware + routes, connects DB
├── middleware/
│   └── auth.js           ✅ protect() — JWT verification, req.user
├── models/
│   ├── User.js           ✅ email, passwordHash, name, loginCount
│   ├── CheckIn.js        ✅ userId, date — compound unique index
│   └── Habit.js          ⚠️  prototype — will be replaced
└── routes/
    ├── auth.js           ✅ signup, login, logout, me
    └── habits.js         ⚠️  prototype — will be replaced
```

### Endpoints live now

| Method | Path | Auth required | What it does |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create account, return JWT |
| POST | `/api/auth/login` | No | Verify credentials, return JWT, record check-in |
| POST | `/api/auth/logout` | No | Client-side only — server confirms |
| GET | `/api/auth/me` | Yes | Return current user from token |
| GET | `/api/health` | No | Server alive check |

---

## 9. What's Next

```
Phase 1 remaining:
  └── Frontend auth UI (Weekend 3)
      ├── React Router setup
      ├── Login + Signup screens
      ├── useAuth hook (Zustand)
      └── Protected route wrapper

Phase 2:
  ├── Goals backend + frontend
  ├── Habits (proper) backend + frontend
  └── Tasks backend + frontend
```

---

*This document is updated as we build. Concepts are explained once — refer back here
before asking "why does this work?"*
