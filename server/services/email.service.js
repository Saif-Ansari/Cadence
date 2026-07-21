const { Resend } = require('resend')

// Built lazily so requiring this module (e.g. from tests, which mock it
// entirely) never needs a real RESEND_API_KEY to be set.
let client = null
function getClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY)
  return client
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function buildHtml(habitNames) {
  const items = habitNames.map((name) => `<li>${escapeHtml(name)}</li>`).join('')
  return `<p>You haven't logged these habits yet today:</p><ul>${items}</ul>`
}

async function sendHabitReminder(toEmail, habitNames) {
  return getClient().emails.send({
    from: process.env.REMINDER_FROM_EMAIL,
    to: toEmail,
    subject: `Reminder: ${habitNames.length} habit${habitNames.length === 1 ? '' : 's'} left today`,
    html: buildHtml(habitNames),
  })
}

module.exports = { sendHabitReminder }
