const mongoose = require('mongoose')

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'overdue'],
      default: 'active',
    },
  },
  { timestamps: true }
)

goalSchema.index({ userId: 1 })

module.exports = mongoose.model('Goal', goalSchema)
