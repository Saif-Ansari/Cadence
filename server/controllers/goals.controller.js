const goalsService = require('../services/goals.service')

async function getGoals(req, res) {
  try {
    const goals = await goalsService.getGoals(req.user._id)
    res.json({ goals })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function createGoal(req, res) {
  const { title, description, deadline } = req.body

  if (!title || !deadline) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Title and deadline are required' } })
  }

  try {
    const goal = await goalsService.createGoal(req.user._id, { title, description, deadline })
    res.status(201).json({ goal })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function updateGoal(req, res) {
  try {
    const goal = await goalsService.updateGoal(req.user._id, req.params.id, req.body)
    res.json({ goal })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function deleteGoal(req, res) {
  try {
    await goalsService.deleteGoal(req.user._id, req.params.id)
    res.json({ message: 'Goal deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function addMilestone(req, res) {
  const { title } = req.body

  if (!title) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'Title is required' } })
  }

  try {
    const milestone = await goalsService.addMilestone(req.user._id, req.params.id, title)
    res.status(201).json({ milestone })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function toggleMilestone(req, res) {
  try {
    const milestone = await goalsService.toggleMilestone(req.user._id, req.params.id, req.params.mid)
    res.json({ milestone })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

async function deleteMilestone(req, res) {
  try {
    await goalsService.deleteMilestone(req.user._id, req.params.id, req.params.mid)
    res.json({ message: 'Milestone deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ error: { code: err.code || 'SERVER_ERROR', message: err.message } })
  }
}

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, addMilestone, toggleMilestone, deleteMilestone }
