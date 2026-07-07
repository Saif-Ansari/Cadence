// The single place that decides what shape of error response the client
// gets. Keeps internal details (raw Mongoose messages, stack traces) out of
// API responses while still returning meaningful status codes for the error
// types we actually expect to see.
function errorHandler(err, req, res, next) {
  // Malformed ObjectId in a route param, e.g. GET /api/reflections/not-an-id
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Invalid id' } })
  }

  // Duplicate key on a unique index — e.g. two concurrent signups with the
  // same email, or a double-clicked habit toggle racing its own upsert.
  if (err.code === 11000) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Resource already exists' } })
  }

  // Schema validation failing on an update query (requires runValidators: true)
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: err.message } })
  }

  // Errors thrown deliberately by services already carry their own status/code
  const status = err.status || 500
  const code = err.code || 'SERVER_ERROR'

  if (status === 500) {
    console.error(err)
  }

  res.status(status).json({
    error: { code, message: status === 500 ? 'Internal server error' : err.message },
  })
}

module.exports = errorHandler
