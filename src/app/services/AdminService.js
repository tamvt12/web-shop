const Cart_Item = require('../models/Cart_Item')
const Favorite = require('../models/Favorite')
const Order = require('../models/Order')
const Order_Item = require('../models/Order_Item')
const Product = require('../models/Product')
const Review = require('../models/Review')
const User = require('../models/User')
const Category = require('../models/Category')

class AdminService {
  countUserOrders = async (user_id) => {
    if (!user_id) {
      return 0
    }
    const orderCount = await Order.countDocuments({ user_id })
    return orderCount
  }

  countProductOrders = async (product_id) => {
    if (!product_id) {
      return 0
    }
    const orderCount = await Order_Item.countDocuments({ product_id })
    return orderCount
  }

  countProductFavorites = async (product_id) => {
    if (!product_id) {
      return 0
    }
    const favoriteCount = await Favorite.countDocuments({ product_id })
    return favoriteCount
  }

  countUserCarts = async (user_id) => {
    if (!user_id) {
      return 0
    }
    const cartCount = await Cart_Item.countDocuments({ user_id })
    return cartCount
  }

  getPagination = (
    totalItems,
    currentPage = 1,
    perPage = 15,
    maxPagesToShow = 5,
  ) => {
    const totalPages = Math.ceil(totalItems / perPage)
    let startPage, endPage
    if (totalPages <= maxPagesToShow) {
      startPage = 1
      endPage = totalPages
    } else {
      const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2)
      const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1
      if (currentPage <= maxPagesBeforeCurrent) {
        startPage = 1
        endPage = maxPagesToShow
      } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1
        endPage = totalPages
      } else {
        startPage = currentPage - maxPagesBeforeCurrent
        endPage = currentPage + maxPagesAfterCurrent
      }
    }
    const pages = []
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    const skip = (currentPage - 1) * perPage
    return { totalPages, pages, skip }
  }

  showOrder = async (page = 1, perPage = 15) => {
    const totalOrders = await Order.countDocuments({})
    const { totalPages, pages, skip } = this.getPagination(
      totalOrders,
      page,
      perPage,
    )
    const orders = await Order.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()
    for (let order of orders) {
      const user = await User.findOne({ id: order.user_id })
      order.username = user ? user.name : ''
    }
    return {
      orders,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  showCartItem = async (page = 1, perPage = 15) => {
    const totalCartItems = await Cart_Item.countDocuments({})
    const { totalPages, pages, skip } = this.getPagination(
      totalCartItems,
      page,
      perPage,
    )
    const cartItems = await Cart_Item.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()

    for (let cartItem of cartItems) {
      const user = await User.findOne({ id: cartItem.user_id })
      cartItem.username = user ? user.name : ''

      const product = await Product.findOne({ id: cartItem.product_id })
      cartItem.product_name = product ? product.name : ''
    }
    return {
      cartItems,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  editOrder = async (id) => {
    const status = ['Chờ xử lý', 'Đang giao', 'Đã hoàn thành']
    const order = await Order.findOne({ id }).lean()
    const user = await User.findOne({ id: order.user_id })
    order.username = user ? user.name : ''
    return { order, status }
  }

  updateOrder = async (id, status) => {
    return await Order.findOneAndUpdate(
      { id },
      { status, updated_at: new Date() },
    )
  }

  showOrderItem = async (page = 1, perPage = 15) => {
    const totalOrderItems = await Order_Item.countDocuments({})
    const { totalPages, pages, skip } = this.getPagination(
      totalOrderItems,
      page,
      perPage,
    )

    const orderItems = await Order_Item.find({})
      .skip(skip)
      .limit(perPage)
      .lean()
    for (let item of orderItems) {
      const product = await Product.findOne({ id: item.product_id })
      const order = await Order.findOne({ id: item.order_id })
      item.product_name = product.name
      item.order_code = order.order_code
    }
    return {
      orderItems,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  showReview = async (page = 1, perPage = 15) => {
    const totalReviews = await Review.countDocuments({})
    const { totalPages, pages, skip } = this.getPagination(
      totalReviews,
      page,
      perPage,
    )

    const reviews = await Review.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()

    for (let review of reviews) {
      const product = await Product.findOne({ id: review.product_id }).lean()
      const user = await User.findOne({ id: review.user_id })
      review.username = user ? user.name : ''
      review.product = product ? product.name : ''
    }
    return {
      reviews,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  showFavorite = async (page = 1, perPage = 15) => {
    const totalFavorites = await Favorite.countDocuments({})
    const { totalPages, pages, skip } = this.getPagination(
      totalFavorites,
      page,
      perPage,
    )

    const favorites = await Favorite.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(perPage)
      .lean()
    const productIds = favorites.map((f) => f.product_id)
    const userIds = favorites.map((f) => f.user_id)
    const products = await Product.find({ id: { $in: productIds } }).lean()
    const users = await User.find({ id: { $in: userIds } }).lean()
    const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]))
    const userMap = Object.fromEntries(
      users.map((u) => [u.id, u.fullName || u.name || u.email]),
    )
    const data = favorites.map((fav) => ({
      id: fav.id,
      productName: productMap[fav.product_id] || 'N/A',
      userName: userMap[fav.user_id] || 'N/A',
      created_at: fav.created_at ? fav.created_at.toLocaleString('vi-VN') : '',
    }))

    return {
      favorites: data,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  getCategories = async (page = 1, perPage = 15) => {
    const totalCategories = await Category.countDocuments({})
    const { totalPages, pages, skip } = this.getPagination(
      totalCategories,
      page,
      perPage,
    )
    const categories = await Category.find({}).skip(skip).limit(perPage).lean()
    return {
      categories,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  createCategory = async ({ name, image_url }) => {
    if (!name || name === '') {
      throw new Error('Chưa nhập tên danh mục!!!')
    }
    const category = new Category({ name, image_url })
    await category.save()
    return category
  }

  getCategoryById = async (id) => {
    return await Category.findOne(
      { id },
      { name: 1, image_url: 1, _id: 0 },
    ).lean()
  }

  updateCategory = async (id, { name, image_url }) => {
    if (!name || name === '') {
      throw new Error('Chưa nhập tên danh mục!!!')
    }
    return await Category.findOneAndUpdate({ id }, { name, image_url })
  }
}

module.exports = new AdminService()
