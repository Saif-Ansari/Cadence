const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date },
    done: { type: Boolean, default: false },
  },
  { timestamps: true }
)

taskSchema.index({ userId: 1 })

module.exports = mongoose.model('Task', taskSchema)
