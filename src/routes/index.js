const { checkLoggedIn, checkAdmin } = require('../middleware/authMiddleware')
const express = require('express')
const userRouter = require('./user')
const adminRouter = require('./admin')
const HomeController = require('../app/controllers/HomeController')
const ProductController = require('../app/controllers/ProductController')
const NewsController = require('../app/controllers/NewsController')
const UserController = require('../app/controllers/UserController')

function route(app) {
  app.use('/admin', checkLoggedIn, checkAdmin, adminRouter)
  app.use('/', userRouter)

  app.use('/uploads', express.static('uploads'))

  app.get('/', HomeController.home)
  app.get('/store', HomeController.showStore)
  app.get('/search', HomeController.search)
  app.get('/products/:id', ProductController.showDetail)
  app.post('/addCart', HomeController.addCart)
  app.post('/buyNow', HomeController.buyNow)
  app.get('/cart', HomeController.showCart)
  app.post('/updateCart', HomeController.updateCart)
  app.delete('/deleteCart/:id', HomeController.deleteCart)
  app.get('/getCheckout', HomeController.getCheckout)
  app.post('/checkout', HomeController.checkOut)
  app.get('/order', HomeController.showOrder)
  app.post('/rating', HomeController.rating)
  app.post('/orders/:id/cancel', HomeController.cancelOrder)
  app.get('/news', NewsController.showList)
  app.get('/news/:id', NewsController.showDetail)
  app.post(
    '/favorite/:productId',
    checkLoggedIn,
    ProductController.createFavorite,
  )
  app.delete(
    '/favorite/:productId',
    checkLoggedIn,
    ProductController.destroyFavorite,
  )
  app.get(
    '/favorite/:productId',
    checkLoggedIn,
    ProductController.checkFavorite,
  )
  app.get('/favorite', checkLoggedIn, ProductController.getProductForFavorite)
}

module.exports = route
