const stepsService = require('../services/steps.service')
const asyncHandler = require('../utils/asyncHandler')

async function createStep(req, res) {
  const { goalId, title, description } = req.body
  if (!goalId) return res.status(400).json({ error: { message: 'goalId is required' } })
  if (!title) return res.status(400).json({ error: { message: 'title is required' } })
  const step = await stepsService.createStep(req.user._id, { goalId, title, description })
  res.status(201).json({ step })
}

async function updateStep(req, res) {
  const step = await stepsService.updateStep(req.user._id, req.params.id, req.body)
  res.json({ step })
}

async function deleteStep(req, res) {
  await stepsService.deleteStep(req.user._id, req.params.id)
  res.json({ message: 'Step deleted' })
}

module.exports = {
  createStep: asyncHandler(createStep),
  updateStep: asyncHandler(updateStep),
  deleteStep: asyncHandler(deleteStep),
}
