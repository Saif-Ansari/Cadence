const reflectionsService = require('../services/reflections.service')

async function getToday(req, res) {
  try {
    const reflection = await reflectionsService.getToday(req.user._id)
    res.json({ reflection })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function upsertToday(req, res) {
  try {
    const reflection = await reflectionsService.upsertToday(req.user._id, req.body)
    res.json({ reflection })
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } })
  }
}

async function getAll(req, res) {
  try {
    const reflections = await reflectionsService.getAll(req.user._id)
    res.json({ reflections })
  } catch (err) {
    res.status(500).json({ error: { message: err.message } })
  }
}

async function getById(req, res) {
  try {
    const reflection = await reflectionsService.getById(req.user._id, req.params.id)
    res.json({ reflection })
  } catch (err) {
    res.status(err.status || 500).json({ error: { message: err.message } })
  }
}

module.exports = { getToday, upsertToday, getAll, getById }
