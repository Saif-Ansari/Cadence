const Task = require('../models/Task')

async function getTasks(userId, filters = {}) {
  const query = { userId }

  if (filters.done !== undefined) query.done = filters.done

  if (filters.today) {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)

    // Delete tasks that belong to a past day — both undated (created before today)
    // and explicitly dated tasks whose dueDate has passed
    await Task.deleteMany({
      userId,
      $or: [
        { dueDate: { $exists: false }, createdAt: { $lt: startOfToday } },
        { dueDate: { $exists: true, $lt: startOfToday } },
      ],
    })

    query.$or = [
      { dueDate: { $lte: end } },
      { dueDate: { $exists: false } },
    ]
  }

  return Task.find(query).sort({ createdAt: -1 })
}

async function createTask(userId, { title, dueDate }) {
  return Task.create({ userId, title, dueDate })
}

async function updateTask(userId, taskId, updates) {
  const allowed = ['title', 'dueDate', 'done']
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([key]) => allowed.includes(key))
  )
  return Task.findOneAndUpdate({ _id: taskId, userId }, filtered, { new: true })
}

async function deleteTask(userId, taskId) {
  return Task.findOneAndDelete({ _id: taskId, userId })
}

module.exports = { getTasks, createTask, updateTask, deleteTask }
