const reflectionsService = require('../services/reflections.service')
const asyncHandler = require('../utils/asyncHandler')

async function getToday(req, res) {
  const reflection = await reflectionsService.getToday(req.user._id, req.query.localDate)
  res.json({ reflection })
}

async function upsertToday(req, res) {
  const reflection = await reflectionsService.upsertToday(req.user._id, req.body, req.body.localDate)
  res.json({ reflection })
}

async function getAll(req, res) {
  const reflections = await reflectionsService.getAll(req.user._id)
  res.json({ reflections })
}

async function getById(req, res) {
  const reflection = await reflectionsService.getById(req.user._id, req.params.id)
  res.json({ reflection })
}

module.exports = {
  getToday: asyncHandler(getToday),
  upsertToday: asyncHandler(upsertToday),
  getAll: asyncHandler(getAll),
  getById: asyncHandler(getById),
}
