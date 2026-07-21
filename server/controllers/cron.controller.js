const remindersService = require('../services/reminders.service')
const emailService = require('../services/email.service')
const asyncHandler = require('../utils/asyncHandler')

async function runHabitReminders(req, res) {
  const reminders = await remindersService.getDueReminders()

  let sent = 0
  for (const { user, undoneHabitNames } of reminders) {
    await emailService.sendHabitReminder(user.email, undoneHabitNames)
    sent++
  }

  res.json({ sent, skipped: reminders.length - sent })
}

module.exports = { runHabitReminders: asyncHandler(runHabitReminders) }
