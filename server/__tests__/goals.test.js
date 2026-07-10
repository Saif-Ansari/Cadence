const request = require('supertest')
const app = require('../app')
const Step = require('../models/Step')

async function createUser(email = 'user@test.com') {
  const res = await request(app).post('/api/auth/signup').send({
    name: 'Test User',
    email,
    password: 'password123',
  })
  return res.body.token
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` }
}

describe('Goals CRUD', () => {
  let token

  beforeEach(async () => {
    token = await createUser()
  })

  it('creates a goal', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set(authHeader(token))
      .send({ title: 'Learn Spanish', deadline: '2026-12-31' })
    expect(res.status).toBe(201)
    expect(res.body.goal.title).toBe('Learn Spanish')
    expect(res.body.goal.progress).toBe(0)
  })

  it('lists goals for the authenticated user only', async () => {
    const token2 = await createUser('other@test.com')
    await request(app).post('/api/goals').set(authHeader(token)).send({ title: 'My Goal', deadline: '2026-12-31' })
    await request(app).post('/api/goals').set(authHeader(token2)).send({ title: 'Other Goal', deadline: '2026-12-31' })

    const res = await request(app).get('/api/goals').set(authHeader(token))
    expect(res.status).toBe(200)
    expect(res.body.goals).toHaveLength(1)
    expect(res.body.goals[0].title).toBe('My Goal')
  })

  it('updates a goal', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set(authHeader(token))
      .send({ title: 'Read More', deadline: '2026-12-31' })
    const id = create.body.goal._id

    const res = await request(app)
      .patch(`/api/goals/${id}`)
      .set(authHeader(token))
      .send({ title: 'Read 12 Books' })
    expect(res.status).toBe(200)
    expect(res.body.goal.title).toBe('Read 12 Books')
  })

  it('strips non-allowed fields on update (NoSQL injection guard)', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set(authHeader(token))
      .send({ title: 'Original', deadline: '2026-12-31' })
    const id = create.body.goal._id

    // userId in the body should be silently ignored, not applied
    const res = await request(app)
      .patch(`/api/goals/${id}`)
      .set(authHeader(token))
      .send({ title: 'Updated', userId: 'injected-value', __proto__: {} })
    expect(res.status).toBe(200)
    expect(res.body.goal.title).toBe('Updated')
  })

  it('deletes a goal with no steps', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set(authHeader(token))
      .send({ title: 'No Steps Goal', deadline: '2026-12-31' })

    const del = await request(app)
      .delete(`/api/goals/${create.body.goal._id}`)
      .set(authHeader(token))
    expect(del.status).toBe(200)
  })

  it('rejects deleting a goal that has incomplete steps', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set(authHeader(token))
      .send({ title: 'Goal With Steps', deadline: '2026-12-31' })
    const goalId = create.body.goal._id

    await request(app).post('/api/steps').set(authHeader(token)).send({ goalId, title: 'Step 1' })
    await request(app).post('/api/steps').set(authHeader(token)).send({ goalId, title: 'Step 2' })

    const del = await request(app).delete(`/api/goals/${goalId}`).set(authHeader(token))
    expect(del.status).toBe(409)
    expect(del.body.error.code).toBe('INCOMPLETE_STEPS')

    // Nothing should have been touched
    const remainingSteps = await Step.find({ goalId })
    expect(remainingSteps).toHaveLength(2)
  })

  it('deletes a goal and cascades to its steps once all steps are done', async () => {
    const create = await request(app)
      .post('/api/goals')
      .set(authHeader(token))
      .send({ title: 'Goal With Steps', deadline: '2026-12-31' })
    const goalId = create.body.goal._id

    const step1 = await request(app).post('/api/steps').set(authHeader(token)).send({ goalId, title: 'Step 1' })
    const step2 = await request(app).post('/api/steps').set(authHeader(token)).send({ goalId, title: 'Step 2' })
    await request(app).patch(`/api/steps/${step1.body.step._id}`).set(authHeader(token)).send({ done: true })
    await request(app).patch(`/api/steps/${step2.body.step._id}`).set(authHeader(token)).send({ done: true })

    const del = await request(app).delete(`/api/goals/${goalId}`).set(authHeader(token))
    expect(del.status).toBe(200)

    const remainingSteps = await Step.find({ goalId })
    expect(remainingSteps).toHaveLength(0)
  })

  it('returns 404 when deleting another user\'s goal', async () => {
    const token2 = await createUser('victim@test.com')
    const create = await request(app)
      .post('/api/goals')
      .set(authHeader(token2))
      .send({ title: 'Protected Goal', deadline: '2026-12-31' })
    const id = create.body.goal._id

    const res = await request(app).delete(`/api/goals/${id}`).set(authHeader(token))
    expect(res.status).toBe(404)
  })
})
