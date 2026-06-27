const express = require('express')
const router = express.Router()
const reflectionsController = require('../controllers/reflections.controller')
const protect = require('../middleware/auth')

router.use(protect)

// /today must be before /:id — otherwise Express treats the string "today" as an id
router.get('/today', reflectionsController.getToday)
router.put('/today', reflectionsController.upsertToday)
router.get('/', reflectionsController.getAll)
router.get('/:id', reflectionsController.getById)

module.exports = router
