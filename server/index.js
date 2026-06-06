const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const habitsRouter = require('./routes/habits');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
// Allow requests from the Vite dev server on port 5173
app.use(cors({ origin: 'http://localhost:5173' }));
// Parse incoming JSON request bodies
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
// Health check — useful to confirm the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// All habit-related routes live under /api/habits
app.use('/api/habits', habitsRouter);

// ── Database + Server start ─────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
