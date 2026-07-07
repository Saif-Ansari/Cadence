// Wraps an async controller so a thrown error or rejected promise is forwarded
// to Express's error-handling middleware via next(err), instead of every
// controller needing its own try/catch just to format an error response.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler
