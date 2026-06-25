const Goal = require('../models/Goal')
const Task = require('../models/Task')

async function getGoals(userId) {
  const goals = await Goal.find({ userId }).sort({ createdAt: -1 })
  const tasks = await Task.find({ userId, goalId: { $exists: true, $ne: null } })

  // Group tasks by goalId for fast lookup
  const tasksByGoal = tasks.reduce((acc, t) => {
    const key = t.goalId.toString()
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  return goals.map((goal) => {
    const goalTasks = tasksByGoal[goal._id.toString()] || []
    const total = goalTasks.length
    const completed = goalTasks.filter((t) => t.done).length
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

    return {
      ...goal.toObject(),
      tasks: goalTasks,
      progress,
    }
  })
}

async function createGoal(userId, { title, description, deadline }) {
  const goal = await Goal.create({ userId, title, description, deadline })
  return { ...goal.toObject(), tasks: [], progress: 0 }
}

async function updateGoal(userId, goalId, updates) {
  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    updates,
    { new: true, runValidators: true }
  )

  if (!goal) {
    const err = new Error('Goal not found')
    err.status = 404
    err.code = 'NOT_FOUND'
    throw err
  }

  return goal
}

async function deleteGoal(userId, goalId) {
  const goal = await Goal.findOneAndDelete({ _id: goalId, userId })

  if (!goal) {
    const err = new Error('Goal not found')
    err.status = 404
    err.code = 'NOT_FOUND'
    throw err
  }

  // Delete tasks that belonged to this goal
  await Task.deleteMany({ goalId })
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal }
