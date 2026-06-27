const express = require('express')
const router = express.Router()
const habitsController = require('../controllers/habits.controller')
const protect = require('../middleware/auth')

router.use(protect)

router.get('/', habitsController.getHabits)
router.get('/consistency', habitsController.getConsistency)
router.post('/', habitsController.createHabit)
router.patch('/:id', habitsController.updateHabit)
router.delete('/:id', habitsController.deleteHabit)
router.patch('/:id/toggle', habitsController.logHabit)

module.exports = router
