const Cart_Item = require('../models/Cart_Item')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Order_Item = require('../models/Order_Item')
const Review = require('../models/Review')
const { request } = require('express')
const Category = require('../models/Category')
const mongoose = require('mongoose')

class HomeController {
  async countUserOrders(user_id) {
    if (!user_id) {
      return 0
    }
    const orderCount = await Order.countDocuments({ user_id })
    return orderCount
  }

  async countUserCarts(user_id) {
    if (!user_id) {
      return 0
    }
    const cartCount = await Cart_Item.countDocuments({ user_id })
    return cartCount
  }

  home = async (req, res) => {
    const user_id = req.session.userId
    const cartCount = await this.countUserCarts(user_id)
    const orderCount = await this.countUserOrders(user_id)

    // Lấy tất cả danh mục
    const categoriesRaw = await Category.find({}).lean()
    const categories = []
    for (let cat of categoriesRaw) {
      // Lấy tối đa 10 sản phẩm thuộc danh mục này
      let products = await Product.find({ category_id: cat._id })
        .limit(10)
        .lean()
      // Tính rating cho từng sản phẩm
      for (let product of products) {
        const ratingData = await Review.aggregate([
          { $match: { product_id: product._id } },
          {
            $group: {
              _id: '$product_id',
              averageRating: { $avg: '$rating' },
              reviewCount: { $sum: 1 },
            },
          },
          { $project: { _id: 0, averageRating: 1, reviewCount: 1 } },
        ])
        if (typeof product.image_url === 'string') {
          const imageArray = product.image_url
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url !== '')
          product.image_url = imageArray.length > 0 ? imageArray[0] : ''
        }
        product.rating = ratingData.length > 0 ? ratingData[0].averageRating : 0
        product.reviewCount =
          ratingData.length > 0 ? ratingData[0].reviewCount : 0
      }
      categories.push({
        _id: cat._id,
        name: cat.name,
        image_url: cat.image_url,
        products,
      })
    }

    res.render('home', {
      showHeader: true,
      categories,
      orderCount,
      cartCount,
    })
  }

  showStore = async (req, res) => {
    const user_id = req.session.userId
    const {
      category: categoryId,
      page: pageQuery,
      minPrice,
      maxPrice,
    } = req.query
    const page = parseInt(pageQuery) || 1
    const perPage = 12

    const cartCount = await this.countUserCarts(user_id)
    const orderCount = await this.countUserOrders(user_id)
    const allCategories = await Category.find({}).lean()

    let currentCategory = null

    const productQuery = {}
    if (categoryId) {
      productQuery.category_id = categoryId
    }
    if (minPrice || maxPrice) {
      productQuery.price = {}
      if (minPrice) {
        productQuery.price.$gte = parseInt(minPrice)
      }
      if (maxPrice) {
        productQuery.price.$lte = parseInt(maxPrice)
      }
    }

    const totalProducts = await Product.countDocuments(productQuery)
    const totalPages = Math.ceil(totalProducts / perPage)

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

    const products = await Product.find(productQuery)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()

    for (let product of products) {
      const ratingData = await Review.aggregate([
        { $match: { product_id: product._id } },
        {
          $group: {
            _id: '$product_id',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ])
      if (typeof product.image_url === 'string') {
        const imageArray = product.image_url
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url !== '')
        product.image_url = imageArray.length > 0 ? imageArray[0] : ''
      }
      product.rating = ratingData.length > 0 ? ratingData[0].averageRating : 0
      product.reviewCount =
        ratingData.length > 0 ? ratingData[0].reviewCount : 0
    }

    if (categoryId) {
      currentCategory = await Category.findById(categoryId).lean()
    }

    res.render('store', {
      showHeader: true,
      products,
      categories: allCategories,
      currentCategory,
      cartCount,
      orderCount,
      currentPage: page,
      totalPages: totalPages,
      pages: pages,
      minPrice,
      maxPrice,
      layout: 'main',
    })
  }

  search = async (req, res) => {
    const search = req.query.search
    const page = parseInt(req.query.page) || 1
    const perPage = 1
    const user_id = req.session.userId
    const cartCount = await this.countUserCarts(user_id)
    const orderCount = await this.countUserOrders(user_id)
    const totalProducts = await Product.countDocuments({
      name: { $regex: new RegExp(search, 'i') },
    })

    const totalPages = Math.ceil(totalProducts / perPage)
    const pages = []
    const maxPagesToShow = 5
    let startPage, endPage
    if (totalPages <= maxPagesToShow) {
      startPage = 12
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

    const products = await Product.find({
      name: { $regex: new RegExp(search, 'i') },
    })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()

    for (let product of products) {
      const ratingData = await Review.aggregate([
        {
          $match: { product_id: product._id },
        },
        {
          $group: {
            _id: '$product_id',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ])

      product.rating = ratingData.length > 0 ? ratingData[0].averageRating : 0
      product.reviewCount =
        ratingData.length > 0 ? ratingData[0].reviewCount : 0
    }

    res.render('store', {
      showHeader: true,
      products,
      orderCount,
      cartCount,
      search,
      currentPage: page,
      totalPages: totalPages,
      pages: pages,
      layout: 'main',
    })
  }

  addCart = (req, res) => {
    const productId = req.body.id
    const quantity = parseInt(req.body.quantity) || 1
    const userId = req.session.userId

    if (!userId) {
      return res.json({ error: 'Unauthorized' })
    }

    Product.findById(productId)
      .then(async (product) => {
        let message = ''
        if (!product) {
          message = 'Sản phẩm không tồn tại'
          return res.json({ error: message })
        }

        if (product.stock <= 0) {
          message = 'Sản phẩm đã hết hàng'
          return res.json({ error: message })
        }

        let cartItem = await Cart_Item.findOne({
          user_id: userId,
          product_id: productId,
        })

        if (cartItem) {
          const newQuantity = cartItem.quantity + quantity
          if (newQuantity > product.stock) {
            message = 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn'
            return res.json({ error: message })
          }
          cartItem.quantity = newQuantity
          await cartItem.save()
        } else {
          if (quantity > product.stock) {
            message = 'Số lượng sản phẩm vượt quá số lượng có sẵn'
            return res.json({ error: message })
          }
          cartItem = await Cart_Item.create({
            user_id: userId,
            product_id: productId,
            quantity: quantity,
          })
        }

        const cartCount = await this.countUserCarts(userId)
        const orderCount = await this.countUserOrders(userId)
        res.json({
          success: true,
          message: 'Thêm vào giỏ hàng thành công',
          cartCount,
          orderCount,
        })
      })
      .catch((err) => {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng:', err)
        res.status(500).json({
          error: 'Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng',
        })
      })
  }

  buyNow = async (req, res) => {
    const productId = req.body.id
    const quantity = parseInt(req.body.quantity) || 1
    const userId = req.session.userId

    if (!userId) {
      return res.json({ error: 'Unauthorized' })
    }

    try {
      const product = await Product.findById(productId)

      if (!product) {
        return res.json({ error: 'Sản phẩm không tồn tại' })
      }

      if (product.stock <= 0) {
        return res.json({ error: 'Sản phẩm đã hết hàng' })
      }

      if (quantity > product.stock) {
        return res.json({ error: 'Số lượng sản phẩm vượt quá số lượng có sẵn' })
      }

      // Tạo cart item mới hoặc cập nhật số lượng nếu đã tồn tại
      let cartItem = await Cart_Item.findOne({
        user_id: userId,
        product_id: productId,
      })

      if (cartItem) {
        const newQuantity = cartItem.quantity + quantity
        if (newQuantity > product.stock) {
          return res.json({
            error: 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn',
          })
        }
        cartItem.quantity = newQuantity
        await cartItem.save()
      } else {
        cartItem = await Cart_Item.create({
          user_id: userId,
          product_id: productId,
          quantity: quantity,
        })
      }

      const cartCount = await this.countUserCarts(userId)
      const orderCount = await this.countUserOrders(userId)

      res.json({
        success: true,
        message: 'Đã thêm vào giỏ hàng',
        redirectUrl: '/cart',
        cartCount,
        orderCount,
      })
    } catch (err) {
      console.error('Lỗi khi mua ngay:', err)
      res.status(500).json({
        error: 'Đã xảy ra lỗi khi xử lý mua ngay',
      })
    }
  }

  async cart(user_id) {
    try {
      const cart_items = await Cart_Item.find({ user_id }).lean()

      let total = 0
      for (let cart_item of cart_items) {
        const product = await Product.findById(cart_item.product_id).lean()
        if (product) {
          if (typeof product.image_url === 'string') {
            const imageArray = product.image_url
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url !== '')
            product.image_url = imageArray
          }

          cart_item.product = product
          cart_item.total = cart_item.quantity * product.price
          total += cart_item.total
        }
      }

      return { cart_items, total }
    } catch (err) {}
  }

  showCart = async (req, res, next) => {
    const user_id = req.session.userId
    const cartCount = await this.countUserCarts(user_id)
    const orderCount = await this.countUserOrders(user_id)
    const { cart_items, total } = await this.cart(user_id)
    res.render('cart', {
      cart_items,
      orderCount,
      cartCount,
      total,
    })
    // res.json({ cart_items });
  }

  updateCart = async (req, res) => {
    const { id, quantity } = req.body
    const user_id = req.session.userId

    if (!user_id) {
      return res.json({ error: 'Unauthorized' })
    }

    try {
      let message = ''
      const cartItem = await Cart_Item.findOne({
        _id: id,
        user_id,
      })

      const product = await Product.findById(cartItem.product_id)
      if (!product) {
        message = 'Sản phẩm không tồn tại'
      }

      if (quantity > product.stock) {
        message = 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn'
      }

      if (message === '') {
        cartItem.quantity = quantity
        await cartItem.save()
      }
      const { cart_items } = await this.cart(user_id)
      res.json({ cart_items, quantity })
    } catch (err) {
      console.error('Error updating cart:', err)
      res.status(500).json({ error: 'Internal Server Error' })
    }
  }

  deleteCart = async (req, res) => {
    const id = req.params.id
    const user_id = req.session.userId

    try {
      let message = ''
      const deletedItem = await Cart_Item.findByIdAndDelete(id)
      if (!deletedItem) {
        return (message = 'Sản phẩm không tồn tại trong giỏ hàng')
      }

      const cartCount = await this.countUserCarts(user_id)
      const orderCount = await this.countUserOrders(user_id)
      const { cart_items } = await this.cart(user_id)

      res.json({ cart_items, cartCount, orderCount })
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm từ giỏ hàng:', error)
      res.status(500).json({
        error: 'Đã xảy ra lỗi khi xóa sản phẩm từ giỏ hàng',
      })
    }
  }

  checkOut = async (req, res) => {
    const user_id = req.session.userId

    try {
      const cartItems = await Cart_Item.find({ user_id })
        .populate('product_id')
        .exec()

      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Giỏ hàng của bạn đang trống.' })
      }

      let total = 0

      for (const cartItem of cartItems) {
        total += cartItem.product_id.price * cartItem.quantity
      }

      const order = new Order({
        user_id,
        total,
        status: 'Chờ xử lý',
      })

      const savedOrder = await order.save()

      const orderItems = []
      for (const cartItem of cartItems) {
        const orderItem = new Order_Item({
          order_id: savedOrder._id,
          product_id: cartItem.product_id._id,
          quantity: cartItem.quantity,
          price: cartItem.product_id.price,
        })
        orderItems.push(orderItem.save())
      }

      const orders = await Order.find({ user_id }).lean()

      for (const order of orders) {
        const items = await Order_Item.find({ order_id: order._id })
          .populate('product_id')
          .lean()

        // Load existing rating for this order
        const existingReview = await Review.findOne({
          user_id: user_id,
          order_id: order._id,
        }).lean()

        // Assign review data to order level
        if (existingReview) {
          order.userRating = existingReview.rating
          order.userComment = existingReview.comment
        } else {
          order.userRating = null
          order.userComment = null
        }

        for (const item of items) {
          if (
            item.product_id &&
            typeof item.product_id.image_url === 'string'
          ) {
            const imageArray = item.product_id.image_url
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url !== '')
            item.product_id.image_url = imageArray
          }
        }
        order.order_Item = items
      }

      for (const item of cartItems) {
        await Product.findByIdAndUpdate(item.product_id._id, {
          $inc: { stock: -item.quantity },
        })
      }

      await Cart_Item.deleteMany({ user_id })
      const cartCount = await this.countUserCarts(user_id)
      const orderCount = await this.countUserOrders(user_id)
      const { cart_items } = await this.cart(user_id)

      res.json({
        success: true,
        message: 'Đặt hàng thành công!',
        cartCount,
        orderCount,
        cart_items,
        orders,
      })
    } catch (error) {
      console.error('Lỗi khi đặt hàng:', error)
      res.status(500).json({ error: 'Đã xảy ra lỗi khi đặt hàng.' })
    }
  }

  showOrder = async (req, res) => {
    const user_id = req.session.userId
    const cartCount = await this.countUserCarts(user_id)
    const orderCount = await this.countUserOrders(user_id)
    try {
      const orders = await Order.find({ user_id })
        .sort({ created_at: -1 })
        .lean()

      for (const order of orders) {
        const items = await Order_Item.find({ order_id: order._id })
          .populate('product_id')
          .lean()

        const existingReview = await Review.findOne({
          user_id: user_id,
          order_id: order._id,
        }).lean()

        // Assign review data to order level
        if (existingReview) {
          order.userRating = existingReview.rating
          order.userComment = existingReview.comment
        } else {
          order.userRating = null
          order.userComment = null
        }

        for (const item of items) {
          if (
            item.product_id &&
            typeof item.product_id.image_url === 'string'
          ) {
            const imageArray = item.product_id.image_url
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url !== '')
            item.product_id.image_url = imageArray
          }
        }
        order.order_Item = items
      }

      orders.sort((a, b) => {
        const statusOrder = {
          'Chờ xử lý': 1,
          'Đang giao': 2,
          'Đã hoàn thành': 3,
        }
        return statusOrder[a.status] - statusOrder[b.status]
      })
      res.render('order', { orders, cartCount, orderCount })
    } catch (error) {
      res.status(500).send('Đã xảy ra lỗi khi tải danh sách đơn hàng')
    }
  }

  rating = async (req, res) => {
    const { product_ids, order_id, rating, comment } = req.body
    const user_id = req.session.userId

    try {
      await Promise.all(
        product_ids.map(async (product_id) => {
          const existingReview = await Review.findOne({
            user_id: user_id,
            product_id: product_id,
            order_id: order_id,
          })

          if (existingReview) {
            existingReview.rating = rating
            existingReview.comment = comment
            existingReview.updated_at = new Date()
            await existingReview.save()
          } else {
            // Create new review
            const newReview = new Review({
              user_id,
              product_id,
              order_id,
              rating,
              comment,
              created_at: new Date(),
            })
            await newReview.save()
          }
        }),
      )

      res.json({ success: true })
    } catch (error) {
      console.error('Error in rating:', error)
      res.json({ success: false })
    }
  }

  showDetail = async (req, res) => {
    try {
      const productId = req.params.id
      const user_id = req.session.userId

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res
          .status(404)
          .render('404', { message: 'Sản phẩm không tồn tại' })
      }

      // Get product details
      const product = await Product.findById(productId).lean()

      if (!product) {
        return res
          .status(404)
          .render('404', { message: 'Sản phẩm không tồn tại' })
      }

      // Get category
      const category = await Category.findById(product.category_id).lean()
      product.category = category

      // Convert image_url string to array
      if (typeof product.image_url === 'string') {
        const imageArray = product.image_url
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url !== '')
        product.image_url = imageArray
      }

      // Get rating data
      const ratingData = await Review.aggregate([
        { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: '$product_id',
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
      ])
      product.rating = ratingData.length > 0 ? ratingData[0].averageRating : 0
      product.reviewCount =
        ratingData.length > 0 ? ratingData[0].reviewCount : 0

      // Get reviews with user info
      const reviews = await Review.aggregate([
        { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            rating: 1,
            comment: 1,
            createdAt: 1,
            'user.name': 1,
            'user.avatar': 1,
          },
        },
        { $sort: { createdAt: -1 } },
      ])

      product.reviews = reviews

      // Get cart and order count
      const cartCount = await this.countUserCarts(user_id)
      const orderCount = await this.countUserOrders(user_id)

      res.render('product-detail', {
        product,
        cartCount,
        orderCount,
      })
    } catch (error) {
      console.error('Error in showProduct:', error)
      res.status(500).render('error', { message: 'Đã có lỗi xảy ra' })
    }
  }
}

module.exports = new HomeController()
