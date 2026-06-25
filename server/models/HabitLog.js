const mongoose = require('mongoose')

const habitLogSchema = new mongoose.Schema(
  {
    habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    done: { type: Boolean, default: true },
  },
  { timestamps: true }
)

habitLogSchema.index({ habitId: 1, userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('HabitLog', habitLogSchema)
