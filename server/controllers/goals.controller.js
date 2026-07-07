const goalsService = require('../services/goals.service')
const asyncHandler = require('../utils/asyncHandler')

async function getGoals(req, res) {
  const goals = await goalsService.getGoals(req.user._id)
  res.json({ goals })
}

async function createGoal(req, res) {
  const { title, description, deadline } = req.body

  if (!title || !deadline) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Title and deadline are required' } })
  }

  const goal = await goalsService.createGoal(req.user._id, { title, description, deadline })
  res.status(201).json({ goal })
}

async function updateGoal(req, res) {
  const goal = await goalsService.updateGoal(req.user._id, req.params.id, req.body)
  res.json({ goal })
}

async function deleteGoal(req, res) {
  await goalsService.deleteGoal(req.user._id, req.params.id)
  res.json({ message: 'Goal deleted' })
}

module.exports = {
  getGoals: asyncHandler(getGoals),
  createGoal: asyncHandler(createGoal),
  updateGoal: asyncHandler(updateGoal),
  deleteGoal: asyncHandler(deleteGoal),
}
