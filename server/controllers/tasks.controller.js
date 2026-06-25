const tasksService = require('../services/tasks.service')

async function getTasks(req, res) {
  try {
    const { goalId, done, today } = req.query
    const filters = {
      goalId,
      done: done !== undefined ? done === 'true' : undefined,
      today: today === 'true',
    }
    const tasks = await tasksService.getTasks(req.user._id, filters)
    res.json({ tasks })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function createTask(req, res) {
  try {
    const { title, goalId, dueDate } = req.body
    if (!title) return res.status(400).json({ error: { message: 'Title is required' } })
    const task = await tasksService.createTask(req.user._id, { title, goalId, dueDate })
    res.status(201).json({ task })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function updateTask(req, res) {
  try {
    const task = await tasksService.updateTask(req.user._id, req.params.id, req.body)
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } })
    res.json({ task })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function deleteTask(req, res) {
  try {
    const task = await tasksService.deleteTask(req.user._id, req.params.id)
    if (!task) return res.status(404).json({ error: { message: 'Task not found' } })
    res.json({ message: 'Task deleted' })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask }
