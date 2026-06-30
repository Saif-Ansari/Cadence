const mongoose = require('mongoose')

const stepSchema = new mongoose.Schema(
  {
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
)

stepSchema.index({ userId: 1 })
stepSchema.index({ goalId: 1 })

module.exports = mongoose.model('Step', stepSchema)
