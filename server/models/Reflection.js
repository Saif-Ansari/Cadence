const mongoose = require('mongoose')

const reflectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    overallDay: { type: String, trim: true },
    accomplished: { type: String, trim: true },
    win: { type: String, trim: true },
    wastedTime: { type: String, trim: true },
    improvement: { type: String, trim: true },
    focusScore: { type: Number, min: 1, max: 10 },
  },
  { timestamps: true }
)

// One reflection per user per day
reflectionSchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('Reflection', reflectionSchema)
