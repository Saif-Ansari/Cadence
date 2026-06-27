const Reflection = require('../models/Reflection')

function normalizeDate(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

async function getToday(userId) {
  const today = normalizeDate(new Date())
  return Reflection.findOne({ userId, date: today })
}

async function upsertToday(userId, fields) {
  const today = normalizeDate(new Date())
  const allowed = ['overallDay', 'accomplished', 'win', 'wastedTime', 'improvement', 'focusScore']
  const data = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)))

  return Reflection.findOneAndUpdate(
    { userId, date: today },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
}

async function getAll(userId) {
  return Reflection.find({ userId }).sort({ date: -1 })
}

async function getById(userId, id) {
  const reflection = await Reflection.findOne({ _id: id, userId })
  if (!reflection) {
    const err = new Error('Reflection not found')
    err.status = 404
    throw err
  }
  return reflection
}

module.exports = { getToday, upsertToday, getAll, getById }
