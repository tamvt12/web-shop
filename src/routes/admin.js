const express = require('express')
const router = express.Router()
const { checkLoggedIn, checkAdmin } = require('../middleware/authMiddleware')
const AdminController = require('../app/controllers/AdminController')
const { upload } = require('../config/upload')
const UserController = require('../app/controllers/UserController')
const NewsController = require('../app/controllers/NewsController')
const ProductController = require('../app/controllers/ProductController')

router.get('/', checkLoggedIn, checkAdmin, (req, res) => {
	res.redirect('/admin/dashboard')
})

router.get('/dashboard', AdminController.dashboard)

//đơn hàng
router.get('/order/list', AdminController.showOrder)
router.get('/order/edit/:id', AdminController.editOrder)
router.post('/order/edit/:id', AdminController.updateOrder)
router.get('/order-item/list', AdminController.showOrderItem)

//giỏ hàng
router.get('/cart-item/list', AdminController.showCartItem)

//đánh giá
router.get('/review/list', AdminController.showReview)

//yêu thích
router.get('/favorite/list', AdminController.showFavorite)

//user
router.get('/user/list', UserController.index)
router.get('/user/edit/:id', UserController.show)
router.post('/user/edit/:id', UserController.update)

//tin tức
router.get('/news/list', checkLoggedIn, checkAdmin, NewsController.index)
router.get('/news/add', checkLoggedIn, checkAdmin, NewsController.create)
router.post('/news/add', NewsController.store)
router.get('/news/edit/:id', NewsController.edit)
router.post('/news/edit/:id', NewsController.update)
router.delete(
  '/news/destroy/:id',
  checkLoggedIn,
  checkAdmin,
  NewsController.destroy,
)

//sản phẩm
router.get('/product/add', ProductController.create)
router.post('/product/add', ProductController.store)
router.get('/product/list', ProductController.index)
router.get('/product/edit/:id', ProductController.show)
router.post('/product/edit/:id', ProductController.update)
router.delete('/product/destroy/:id', ProductController.destroy)

//thể loại
router.get('/category/add', AdminController.categoryAdd)
router.post('/category/add', AdminController.categoryStore)
router.get('/category/list', AdminController.categoryList)
router.get('/category/edit/:id', AdminController.categoryEdit)
router.post('/category/edit/:id', AdminController.categoryUpdate)
router.delete('/category/destroy/:id', AdminController.categoryDestroy)

//upload ảnh
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
