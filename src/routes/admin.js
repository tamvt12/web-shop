const express = require('express')
const router = express.Router()
const AdminController = require('../app/controllers/AdminController')
const FavoriteController = require('../app/controllers/FavoriteController')
const { upload } = require('../config/upload')
const UserController = require('../app/controllers/UserController')

router.get('/order/list', AdminController.showOrder)
router.get('/order/edit/:id', AdminController.editOrder)
router.post('/order/edit/:id', AdminController.updateOrder)
router.get('/cart-item/list', AdminController.showCartItem)
router.get('/order-item/list', AdminController.showOrderItem)
router.get('/review/list', AdminController.showReview)
router.get('/favorite/list', FavoriteController.index)
router.get('/user/list', UserController.index)
router.get('/user/edit/:id', UserController.show)
router.post('/user/edit/:id', UserController.update)
router.post('/upload-image', (req, res, next) => {
  upload.array('images', 10)(req, res, function (err) {
    if (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      })
      return
    }
    AdminController.upload(req, res, next)
  })
})

module.exports = router
