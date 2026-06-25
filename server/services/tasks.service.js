const Task = require('../models/Task')

async function getTasks(userId, filters = {}) {
  const query = { userId }

  if (filters.goalId) query.goalId = filters.goalId
  if (filters.done !== undefined) query.done = filters.done

  if (filters.today) {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    query.$or = [
      { dueDate: { $lte: end } },
      { dueDate: { $exists: false } },
    ]
  }

  return Task.find(query).sort({ createdAt: -1 })
}

async function createTask(userId, { title, goalId, dueDate }) {
  return Task.create({ userId, title, goalId, dueDate })
}

async function updateTask(userId, taskId, updates) {
  const allowed = ['title', 'goalId', 'dueDate', 'done']
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  )
  return Task.findOneAndUpdate({ _id: taskId, userId }, filtered, { new: true })
}

async function deleteTask(userId, taskId) {
  return Task.findOneAndDelete({ _id: taskId, userId })
}

module.exports = { getTasks, createTask, updateTask, deleteTask }
