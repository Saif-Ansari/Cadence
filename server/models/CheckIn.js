const mongoose = require('mongoose')

const checkInSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
})

// Compound unique index: one check-in per user per day, enforced at DB level
checkInSchema.index({ userId: 1, date: 1 }, { unique: true })

module.exports = mongoose.model('CheckIn', checkInSchema)
