// cronAuth — guards machine-to-machine endpoints triggered by the GitHub
// Actions scheduler, which has no user/JWT of its own. A shared secret in
// the x-cron-secret header stands in for auth here.
function cronAuth(req, res, next) {
  const secret = process.env.CRON_SECRET
  const provided = req.headers['x-cron-secret']

  if (!secret || provided !== secret) {
    return res.status(401).json({ error: { code: 'INVALID_CRON_SECRET', message: 'Not authorised' } })
  }

  next()
}

module.exports = cronAuth
