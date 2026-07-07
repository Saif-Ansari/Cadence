// A "day" in Cadence (check-in, habit log, reflection) means the calendar
// date as the user experiences it locally — not the date on whatever machine
// happens to be running the server process. Only the client actually knows
// the user's local time, so callers pass a 'YYYY-MM-DD' string and the server
// just anchors it to UTC midnight for consistent storage and comparison.
// Never derive "today" from the server process's own clock/timezone.

function parseDateOnly(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

// Fallback for callers that don't supply a local date (older clients, tests).
// Uses the server's own UTC calendar day — better than nothing, but this is
// the one place remaining where "today" can drift from the user's real day.
function todayFallbackUTC() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

function resolveDateOnly(dateStr) {
  return dateStr ? parseDateOnly(dateStr) : todayFallbackUTC()
}

module.exports = { parseDateOnly, todayFallbackUTC, resolveDateOnly }
