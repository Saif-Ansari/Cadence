const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    // Opt-in daily email reminder for undone habits. `mode: 'all'` reminds
    // about every active habit; `mode: 'specific'` narrows it to `habitIds`.
    // habitIds is only read when mode is 'specific'.
    emailReminders: {
      enabled: { type: Boolean, default: false },
      mode: { type: String, enum: ['all', 'specific'], default: 'all' },
      habitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Habit' }],
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
)

module.exports = mongoose.model('User', userSchema)
