require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')

// Fail fast: a missing JWT_SECRET must not silently reach jwt.sign() on the
// first login request — better a clear crash at boot than a confusing 500 later.
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set — refusing to start')
  process.exit(1)
}

const PORT = process.env.PORT || 5000

connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    )
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message)
    process.exit(1)
  })
