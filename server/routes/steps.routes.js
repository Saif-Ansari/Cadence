const express = require('express')
const router = express.Router()
const stepsController = require('../controllers/steps.controller')
const protect = require('../middleware/auth')

router.use(protect)

router.post('/', stepsController.createStep)
router.patch('/:id', stepsController.updateStep)
router.delete('/:id', stepsController.deleteStep)

module.exports = router
