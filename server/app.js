const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const authRoutes = require('./routes/auth.routes')
const goalsRoutes = require('./routes/goals.routes')
const habitsRoutes = require('./routes/habits.routes')
const tasksRoutes = require('./routes/tasks.routes')
const stepsRoutes = require('./routes/steps.routes')
const reflectionsRoutes = require('./routes/reflections.routes')
const errorHandler = require('./middleware/errorHandler')

const app = express()

// Railway (and most PaaS hosts) sit in front of the app as a reverse proxy.
// Without this, req.ip is always the proxy's internal address, so rate
// limiting would bucket every user together instead of by real client IP.
app.set('trust proxy', 1)

app.use(helmet())

// CORS_ORIGINS is a comma-separated list — e.g. "https://cadence.vercel.app,http://localhost:5173"
// Falls back to local dev ports so `npm run dev` keeps working with no .env changes.
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// bcrypt.compare is intentionally slow, which makes /api/auth/login a cheap
// CPU-exhaustion target as well as a brute-forceable endpoint — cap attempts
// per IP instead of letting requests through at full speed.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // The test suite legitimately makes more than 20 auth requests per file
  // (many small, focused tests, each signing up its own user) — that's not
  // the brute-force pattern this limiter defends against. Jest sets
  // NODE_ENV=test automatically, so this only affects `npm test`, never prod.
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Try again later.' } },
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/goals', goalsRoutes)
app.use('/api/habits', habitsRoutes)
app.use('/api/tasks', tasksRoutes)
app.use('/api/steps', stepsRoutes)
app.use('/api/reflections', reflectionsRoutes)

// Unknown /api/* routes — without this Express falls through to its default
// HTML 404 page, which breaks a client expecting { error: { code, message } }.
app.use('/api', (req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } })
})

// Must be registered last — Express recognizes an error handler by its
// 4-argument signature (err, req, res, next), regardless of where it sits
// in the file, but it only catches errors from routes registered above it.
app.use(errorHandler)

module.exports = app
