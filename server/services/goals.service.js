const Goal = require('../models/Goal')
const Milestone = require('../models/Milestone')

async function getGoals(userId) {
  const goals = await Goal.find({ userId }).sort({ createdAt: -1 })
  const milestones = await Milestone.find({ userId })

  // Group milestones by goalId for fast lookup
  const milestonesByGoal = milestones.reduce((acc, m) => {
    const key = m.goalId.toString()
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  return goals.map((goal) => {
    const goalMilestones = milestonesByGoal[goal._id.toString()] || []
    const total = goalMilestones.length
    const completed = goalMilestones.filter((m) => m.done).length
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100)

    return {
      ...goal.toObject(),
      milestones: goalMilestones,
      progress,
    }
  })
}

async function createGoal(userId, { title, description, deadline }) {
  const goal = await Goal.create({ userId, title, description, deadline })
  return { ...goal.toObject(), milestones: [], progress: 0 }
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

  // Clean up milestones that belonged to this goal
  await Milestone.deleteMany({ goalId })
}

async function addMilestone(userId, goalId, title) {
  const goal = await Goal.findOne({ _id: goalId, userId })

  if (!goal) {
    const err = new Error('Goal not found')
    err.status = 404
    err.code = 'NOT_FOUND'
    throw err
  }

  return Milestone.create({ goalId, userId, title })
}

async function toggleMilestone(userId, goalId, milestoneId) {
  const milestone = await Milestone.findOne({ _id: milestoneId, goalId, userId })

  if (!milestone) {
    const err = new Error('Milestone not found')
    err.status = 404
    err.code = 'NOT_FOUND'
    throw err
  }

  milestone.done = !milestone.done
  await milestone.save()
  return milestone
}

async function deleteMilestone(userId, goalId, milestoneId) {
  const milestone = await Milestone.findOneAndDelete({ _id: milestoneId, goalId, userId })

  if (!milestone) {
    const err = new Error('Milestone not found')
    err.status = 404
    err.code = 'NOT_FOUND'
    throw err
  }
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone }
