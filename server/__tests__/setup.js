const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  process.env.MONGO_URI = mongod.getUri()
  process.env.JWT_SECRET = 'test-secret-key'
  await mongoose.connect(process.env.MONGO_URI)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})
