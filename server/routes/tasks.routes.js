const express = require('express')
const router = express.Router()
const tasksController = require('../controllers/tasks.controller')
const protect = require('../middleware/auth')

router.use(protect)

router.get('/', tasksController.getTasks)
router.post('/', tasksController.createTask)
router.patch('/:id', tasksController.updateTask)
router.delete('/:id', tasksController.deleteTask)

module.exports = router
