const Cart_Item = require('../models/Cart_Item')
const Order = require('../models/Order')
const Order_Item = require('../models/Order_Item')
const Product = require('../models/Product')
const Review = require('../models/Review')
const User = require('../models/User')

class AdminController {
  async showOrder(req, res, next) {
    const orders = await Order.find({}).lean()
    for (let order of orders) {
      const user = await User.findOne({ id: order.user_id })
      order.username = user ? user.name : ''
    }
    res.render('admin/order/list', { showAdmin: true, orders })
  }

  async editOrder(req, res, next) {
    try {
      const status = ['Chờ xử lý', 'Đang giao', 'Đã hoàn thành']
      const order = await Order.findOne({ id: req.params.id }).lean()

      const user = await User.findOne({ id: order.user_id })
      order.username = user ? user.name : ''

      res.render('admin/order/edit', {
        order,
        status,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load product.')
      res.redirect('/admin')
    }
  }

  async updateOrder(req, res, next) {
    const status = req.body.status
    const id = req.params.id
    try {
      const updatedOrder = await Order.findOneAndUpdate(
        { id },
        {
          status,
        },
      )
      if (updatedOrder) {
        res.redirect('/admin/order/list')
      } else {
        req.flash('error', 'Cập nhập thất bại!!!')
        const referer = req.get('Referer')
        res.redirect(referer)
      }
    } catch (error) {
      req.flash('error', 'Cập nhập thất bại!!!')
      const referer = req.get('Referer')
      res.redirect(referer)
    }
  }

  async showCartItem(req, res) {
    const cartItems = await Cart_Item.find().populate('product_id').lean()

    for (let cartItem of cartItems) {
      const user = await User.findOne({ id: cartItem.user_id })
      cartItem.username = user ? user.name : ''
    }

    res.render('admin/cart-item/list', { showAdmin: true, cartItems })
  }

  async showOrderItem(req, res) {
    const orderItems = await Order_Item.find().lean()
    for (let item of orderItems) {
      const product = await Product.findOne({ id: item.product_id })
      item.product_name = product.name
    }

    res.render('admin/order-item/list', { showAdmin: true, orderItems })
  }

  async showReview(req, res) {
    const reviews = await Review.find({}).lean()

    for (let review of reviews) {
      const product = await Product.findOne({ id: review.product_id }).lean()
      const user = await User.findOne({ id: review.user_id })
      review.username = user ? user.name : ''
      review.product = product ? product.name : ''
    }
    res.render('admin/review/list', { showAdmin: true, reviews })
  }

  upload(req, res) {
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map((file) => file.path)
      res.json({
        success: true,
        message: 'Upload thành công',
        imageUrls: imageUrls,
        imageUrl: imageUrls[0],
      })
    } else {
      res.json({
        success: false,
        message: 'Upload thất bại',
      })
    }
  }
}

module.exports = new AdminController()
