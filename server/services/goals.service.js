const Goal = require('../models/Goal')
const Step = require('../models/Step')

async function getGoals(userId) {
  const goals = await Goal.find({ userId }).sort({ createdAt: -1 })
  const steps = await Step.find({ userId })

  const stepsByGoal = steps.reduce((acc, s) => {
    const key = s.goalId.toString()
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return goals.map((goal) => {
    const goalSteps = stepsByGoal[goal._id.toString()] || []
    const total = goalSteps.length
    const completed = goalSteps.filter((s) => s.done).length
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100)
    return { ...goal.toObject(), steps: goalSteps, progress }
  })
}

async function createGoal(userId, { title, description, deadline }) {
  const goal = await Goal.create({ userId, title, description, deadline })
  return { ...goal.toObject(), steps: [], progress: 0 }
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
    throw err
  }
  return goal
}

async function deleteGoal(userId, goalId) {
  const goal = await Goal.findOneAndDelete({ _id: goalId, userId })
  if (!goal) {
    const err = new Error('Goal not found')
    err.status = 404
    throw err
  }
  await Step.deleteMany({ goalId })
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal }
