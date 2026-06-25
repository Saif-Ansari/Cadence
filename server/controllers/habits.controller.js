const habitsService = require('../services/habits.service')

async function getHabits(req, res) {
  try {
    const habits = await habitsService.getHabits(req.user._id)
    res.json({ habits })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function createHabit(req, res) {
  try {
    const { name, targetFrequency, description } = req.body
    if (!name) return res.status(400).json({ error: { message: 'Name is required' } })
    if (!targetFrequency || targetFrequency < 1 || targetFrequency > 7) {
      return res.status(400).json({ error: { message: 'targetFrequency must be between 1 and 7' } })
    }
    const habit = await habitsService.createHabit(req.user._id, { name, targetFrequency, description })
    res.status(201).json({ habit })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function updateHabit(req, res) {
  try {
    const habit = await habitsService.updateHabit(req.user._id, req.params.id, req.body)
    if (!habit) return res.status(404).json({ error: { message: 'Habit not found' } })
    res.json({ habit })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function deleteHabit(req, res) {
  try {
    const habit = await habitsService.deleteHabit(req.user._id, req.params.id)
    if (!habit) return res.status(404).json({ error: { message: 'Habit not found' } })
    res.json({ message: 'Habit deleted' })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function logHabit(req, res) {
  try {
    const { date } = req.body
    if (!date) return res.status(400).json({ error: { message: 'Date is required' } })
    const result = await habitsService.logHabit(req.user._id, req.params.id, date)
    if (!result) return res.status(404).json({ error: { message: 'Habit not found' } })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

module.exports = { getHabits, createHabit, updateHabit, deleteHabit, logHabit }
