const mongoose = require('mongoose')

const habitSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    targetFrequency: { type: Number, required: true, min: 1, max: 7 },
    description: { type: String, trim: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
  },
  { timestamps: true }
)

habitSchema.index({ userId: 1 })

module.exports = mongoose.model('Habit', habitSchema)
