// The server can't know the user's real local time — only the browser can.
// This returns the user's current calendar day as 'YYYY-MM-DD', read from
// local Date getters (never toISOString, which converts to UTC and can be
// off by a day near midnight). Send this to the server whenever an action
// is tied to "today" (login/check-in, habit toggles, reflections).
export function todayLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
