const User = require('../models/User')
const Habit = require('../models/Habit')
const HabitLog = require('../models/HabitLog')
const { normalizeDate } = require('./habits.service')

// Which of a user's active habits are in scope for their reminder, given
// their stored mode. 'specific' intersects with the user's *current* active
// habits, so a habit that's since been deleted or completed just drops out
// on its own — nothing needs to clean up stale ids in emailReminders.habitIds.
function resolveInScopeHabits(user, activeHabits) {
  if (user.emailReminders.mode !== 'specific') return activeHabits

  const chosenIds = new Set(user.emailReminders.habitIds.map((id) => id.toString()))
  return activeHabits.filter((h) => chosenIds.has(h._id.toString()))
}

// Returns { user, undoneHabitNames } or null if this user needs no email
// right now (nothing in scope, or everything already logged today).
async function getReminderForUser(user, today) {
  const activeHabits = await Habit.find({ userId: user._id, status: 'active' })
  const inScope = resolveInScopeHabits(user, activeHabits)
  if (inScope.length === 0) return null

  const logs = await HabitLog.find({
    userId: user._id,
    habitId: { $in: inScope.map((h) => h._id) },
    date: today,
  })
  const doneIds = new Set(logs.map((l) => l.habitId.toString()))
  const undoneHabits = inScope.filter((h) => !doneIds.has(h._id.toString()))
  if (undoneHabits.length === 0) return null

  return { user, undoneHabitNames: undoneHabits.map((h) => h.name) }
}

// The one deliberate exception to "never derive today from the server's own
// clock" (see server/utils/dateOnly.js) — a scheduled job has no client to
// supply a localDate, so "today" is the server's UTC calendar day at
// whatever fixed UTC hour the job is scheduled to run.
async function getDueReminders() {
  const dueUsers = await User.find({ 'emailReminders.enabled': true })
  const today = normalizeDate(new Date())

  const reminders = []
  for (const user of dueUsers) {
    const reminder = await getReminderForUser(user, today)
    if (reminder) reminders.push(reminder)
  }
  return reminders
}

module.exports = { getDueReminders }
