const habitsService = require('../services/habits.service')
const asyncHandler = require('../utils/asyncHandler')

async function getHabits(req, res) {
  const habits = await habitsService.getHabits(req.user._id, req.query.localDate)
  res.json({ habits })
}

async function createHabit(req, res) {
  const { name, targetFrequency, description } = req.body
  if (!name) return res.status(400).json({ error: { message: 'Name is required' } })
  if (!targetFrequency || targetFrequency < 1 || targetFrequency > 7) {
    return res.status(400).json({ error: { message: 'targetFrequency must be between 1 and 7' } })
  }
  const habit = await habitsService.createHabit(req.user._id, { name, targetFrequency, description })
  res.status(201).json({ habit })
}

async function updateHabit(req, res) {
  const { targetFrequency } = req.body
  if (targetFrequency !== undefined && (targetFrequency < 1 || targetFrequency > 7)) {
    return res.status(400).json({ error: { message: 'targetFrequency must be between 1 and 7' } })
  }
  const habit = await habitsService.updateHabit(req.user._id, req.params.id, req.body)
  if (!habit) return res.status(404).json({ error: { message: 'Habit not found' } })
  res.json({ habit })
}

async function deleteHabit(req, res) {
  const habit = await habitsService.deleteHabit(req.user._id, req.params.id)
  if (!habit) return res.status(404).json({ error: { message: 'Habit not found' } })
  res.json({ message: 'Habit deleted' })
}

async function logHabit(req, res) {
  const { date } = req.body
  if (!date) return res.status(400).json({ error: { message: 'Date is required' } })
  const result = await habitsService.logHabit(req.user._id, req.params.id, date)
  if (!result) return res.status(404).json({ error: { message: 'Habit not found' } })
  res.json(result)
}

async function getConsistency(req, res) {
  const data = await habitsService.getConsistency(req.user._id, req.query.localDate)
  res.json({ consistency: data })
}

module.exports = {
  getHabits: asyncHandler(getHabits),
  createHabit: asyncHandler(createHabit),
  updateHabit: asyncHandler(updateHabit),
  deleteHabit: asyncHandler(deleteHabit),
  logHabit: asyncHandler(logHabit),
  getConsistency: asyncHandler(getConsistency),
}
