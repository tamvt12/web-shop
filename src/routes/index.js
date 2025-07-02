const { checkLoggedIn, checkAdmin } = require('../middleware/authMiddleware')
const express = require('express')
const userRouter = require('./user')
const categoryRouter = require('./category')
const productRouter = require('./product')
const adminRouter = require('./admin')
const newsRouter = require('./news')
const HomeController = require('../app/controllers/HomeController')
const NewsController = require('../app/controllers/NewsController')

function route(app) {
  app.use('/news', newsRouter)
  app.use('/admin/category', checkLoggedIn, checkAdmin, categoryRouter)
  app.use('/admin/product', checkLoggedIn, checkAdmin, productRouter)
  app.use('/admin/news', checkLoggedIn, checkAdmin, newsRouter)
  app.use('/admin', checkLoggedIn, checkAdmin, adminRouter)

  app.get('/admin', checkLoggedIn, checkAdmin, (req, res) => {
    res.render('admin/index', {
      showAdmin: true,
    })
  })

  app.use('/uploads', express.static('uploads'))
  app.use('/', userRouter)

  app.get('/', HomeController.home)
  app.get('/store', HomeController.showStore)
  app.get('/search', HomeController.search)
  app.get('/products/:id', HomeController.showDetail)
  app.post('/addCart', HomeController.addCart)
  app.post('/buyNow', HomeController.buyNow)
  app.get('/cart', HomeController.showCart)
  app.post('/updateCart', HomeController.updateCart)
  app.delete('/deleteCart/:id', HomeController.deleteCart)
  app.get('/getCheckout', HomeController.getCheckout)
  app.post('/checkout', HomeController.checkOut)
  app.get('/order', HomeController.showOrder)
  app.post('/rating', HomeController.rating)
  app.get('/news', NewsController.showList)
  app.get('/news/:id', NewsController.showDetail)
}

module.exports = route
