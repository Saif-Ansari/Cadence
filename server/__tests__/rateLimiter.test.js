const request = require('supertest')
const app = require('../app')

describe('Rate limiting on /api/auth', () => {
  it('blocks further attempts after the configured max', async () => {
    // app.js skips rate limiting when NODE_ENV === 'test' (see app.js) so the
    // rest of the suite can make routine auth requests without tripping it.
    // Flip it here to exercise the limiter's real behavior for this one test.
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      let lastStatus
      for (let i = 0; i < 21; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ email: 'nobody@test.com', password: 'wrong' })
        lastStatus = res.status
      }
      expect(lastStatus).toBe(429)
    } finally {
      process.env.NODE_ENV = originalEnv
    }
  })
})
