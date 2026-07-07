const Step = require('../models/Step')
const Goal = require('../models/Goal')

async function createStep(userId, { goalId, title, description }) {
  const goal = await Goal.findOne({ _id: goalId, userId })
  if (!goal) {
    const err = new Error('Goal not found')
    err.status = 404
    throw err
  }
  return Step.create({ userId, goalId, title, description })
}

async function updateStep(userId, stepId, updates) {
  const allowed = ['title', 'description', 'done']
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )
  const step = await Step.findOneAndUpdate({ _id: stepId, userId }, filtered, { new: true, runValidators: true })
  if (!step) {
    const err = new Error('Step not found')
    err.status = 404
    throw err
  }
  return step
}

async function deleteStep(userId, stepId) {
  const step = await Step.findOneAndDelete({ _id: stepId, userId })
  if (!step) {
    const err = new Error('Step not found')
    err.status = 404
    throw err
  }
  return step
}

module.exports = { createStep, updateStep, deleteStep }
