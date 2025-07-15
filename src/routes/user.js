const express = require('express')
const router = express.Router()
const { checkLoggedIn } = require('../middleware/authMiddleware')
const userController = require('../app/controllers/UserController')

router.get('/login', userController.showLogin)
router.get('/register', userController.showRegister)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/logout', userController.logout)
router.post('/update', userController.update)
router.post('/change-password', checkLoggedIn, userController.changePassword)
router.get('/forgot-password', userController.showForgotPasswordForm)
router.post('/forgot-password', userController.handleForgotPassword)
router.get('/reset-password/:token', userController.showResetPasswordForm)
router.post('/reset-password/:token', userController.handleResetPassword)

module.exports = router
