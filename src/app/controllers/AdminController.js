const Cart_Item = require('../models/Cart_Item')
const Order = require('../models/Order')
const Order_Item = require('../models/Order_Item')
const Product = require('../models/Product')
const Review = require('../models/Review')
const User = require('../models/User')

class AdminController {
  showOrder = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const totalOrders = await Order.countDocuments({})
    const totalPages = Math.ceil(totalOrders / perPage)

    const pages = []
    const maxPagesToShow = 5
    let startPage, endPage
    if (totalPages <= maxPagesToShow) {
      startPage = 1
      endPage = totalPages
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2)
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1
      if (page <= maxPagesBeforeCurrent) {
        startPage = 1
        endPage = maxPagesToShow
      } else if (page + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1
        endPage = totalPages
      } else {
        startPage = page - maxPagesBeforeCurrent
        endPage = page + maxPagesAfterCurrent
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    const orders = await Order.find({})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()
    for (let order of orders) {
      const user = await User.findOne({ id: order.user_id })
      order.username = user ? user.name : ''
    }
    res.render('admin/order/list', {
      showAdmin: true,
      orders,
      currentPage: page,
      totalPages,
      pages,
    })
  }

  editOrder = async (req, res) => {
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

  updateOrder = async (req, res) => {
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

  showCartItem = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const totalCartItems = await Cart_Item.countDocuments({})
    const totalPages = Math.ceil(totalCartItems / perPage)

    const pages = []
    const maxPagesToShow = 5
    let startPage, endPage
    if (totalPages <= maxPagesToShow) {
      startPage = 1
      endPage = totalPages
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2)
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1
      if (page <= maxPagesBeforeCurrent) {
        startPage = 1
        endPage = maxPagesToShow
      } else if (page + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1
        endPage = totalPages
      } else {
        startPage = page - maxPagesBeforeCurrent
        endPage = page + maxPagesAfterCurrent
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    const cartItems = await Cart_Item.find({})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()

    for (let cartItem of cartItems) {
      const user = await User.findOne({ id: cartItem.user_id })
      cartItem.username = user ? user.name : ''

      const product = await Product.findOne({ id: cartItem.product_id })
      cartItem.product_name = product ? product.name : ''
    }

    res.render('admin/cart-item/list', {
      showAdmin: true,
      cartItems,
      currentPage: page,
      totalPages,
      pages,
    })
  }

  showOrderItem = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const totalOrderItems = await Order_Item.countDocuments({})
    const totalPages = Math.ceil(totalOrderItems / perPage)

    const pages = []
    const maxPagesToShow = 5
    let startPage, endPage
    if (totalPages <= maxPagesToShow) {
      startPage = 1
      endPage = totalPages
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2)
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1
      if (page <= maxPagesBeforeCurrent) {
        startPage = 1
        endPage = maxPagesToShow
      } else if (page + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1
        endPage = totalPages
      } else {
        startPage = page - maxPagesBeforeCurrent
        endPage = page + maxPagesAfterCurrent
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    const orderItems = await Order_Item.find({})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()
    for (let item of orderItems) {
      const product = await Product.findOne({ id: item.product_id })
      const order = await Order.findOne({ id: item.order_id })
      item.product_name = product.name
      item.order_code = order.order_code
    }
    res.render('admin/order-item/list', {
      showAdmin: true,
      orderItems,
      currentPage: page,
      totalPages,
      pages,
    })
  }

  showReview = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const totalReviews = await Review.countDocuments({})
    const totalPages = Math.ceil(totalReviews / perPage)

    const pages = []
    const maxPagesToShow = 5
    let startPage, endPage
    if (totalPages <= maxPagesToShow) {
      startPage = 1
      endPage = totalPages
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2)
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1
      if (page <= maxPagesBeforeCurrent) {
        startPage = 1
        endPage = maxPagesToShow
      } else if (page + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1
        endPage = totalPages
      } else {
        startPage = page - maxPagesBeforeCurrent
        endPage = page + maxPagesAfterCurrent
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }

    const reviews = await Review.find({})
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()

    for (let review of reviews) {
      const product = await Product.findOne({ id: review.product_id }).lean()
      const user = await User.findOne({ id: review.user_id })
      review.username = user ? user.name : ''
      review.product = product ? product.name : ''
    }
    res.render('admin/review/list', {
      showAdmin: true,
      reviews,
      currentPage: page,
      totalPages,
      pages,
    })
  }

  upload = (req, res) => {
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
