const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Task', taskSchema)
