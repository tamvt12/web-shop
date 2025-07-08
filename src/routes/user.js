const express = require('express')
const router = express.Router()
const { checkLoggedIn } = require('../middleware/authMiddleware')
const userController = require('../app/controllers/UserController')
const FavoriteController = require('../app/controllers/FavoriteController')

router.post('/wishlist/:productId', checkLoggedIn, userController.addWishlist)
router.delete(
  '/wishlist/:productId',
  checkLoggedIn,
  userController.removeWishlist,
)
router.get('/wishlist/:productId', checkLoggedIn, userController.checkWishlist)
router.get('/wishlist', checkLoggedIn, FavoriteController.userWishlist)

router.get('/login', userController.showLogin)
router.get('/register', userController.showRegister)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.get('/logout', userController.logout)
router.post('/update', userController.update)
router.post('/change-password', checkLoggedIn, userController.changePassword)
router.get('/users', userController.index)

module.exports = router
