const stepsService = require('../services/steps.service')

async function createStep(req, res) {
  try {
    const { goalId, title, description } = req.body
    if (!goalId) return res.status(400).json({ error: { message: 'goalId is required' } })
    if (!title) return res.status(400).json({ error: { message: 'title is required' } })
    const step = await stepsService.createStep(req.user._id, { goalId, title, description })
    res.status(201).json({ step })
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } })
  }
}

async function updateStep(req, res) {
  try {
    const step = await stepsService.updateStep(req.user._id, req.params.id, req.body)
    res.json({ step })
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } })
  }
}

async function deleteStep(req, res) {
  try {
    await stepsService.deleteStep(req.user._id, req.params.id)
    res.json({ message: 'Step deleted' })
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } })
  }
}

module.exports = { createStep, updateStep, deleteStep }
