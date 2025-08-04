const Cart_Item = require('../models/Cart_Item')
const Order = require('../models/Order')
const Order_Item = require('../models/Order_Item')
const Product = require('../models/Product')
const Review = require('../models/Review')
const User = require('../models/User')

class AdminController {
  dashboard = async (req, res) => {
    try {
			const currentYear = new Date().getFullYear()
		const startYear = 2020
      // Lấy tháng từ query parameter, mặc định là tháng hiện tại
      const selectedMonth = req.query.month || new Date().getMonth() + 1
      const selectedYear = req.query.year || new Date().getFullYear()

      // Tạo date range cho tháng được chọn
      const startDate = new Date(selectedYear, selectedMonth - 1, 1)
      const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59)

      // Thống kê doanh số theo tháng
      const monthlyStats = await Order.aggregate([
        {
          $match: {
            created_at: { $gte: startDate, $lte: endDate },
            status: 'Đã hoàn thành'
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$total' },
            totalOrders: { $sum: 1 }
          }
        }
      ])

      // Thống kê doanh số theo ngày trong tháng
      const dailyStats = await Order.aggregate([
        {
          $match: {
            created_at: { $gte: startDate, $lte: endDate },
            status: 'Đã hoàn thành'
          }
        },
        {
          $group: {
            _id: { $dayOfMonth: '$created_at' },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ])

      // Sản phẩm bán chạy trong tháng
      const topProducts = await Order_Item.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: 'order_id',
            foreignField: 'id',
            as: 'order'
          }
        },
        {
          $unwind: '$order'
        },
        {
          $match: {
            'order.created_at': { $gte: startDate, $lte: endDate },
            'order.status': 'Đã hoàn thành'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product_id',
            foreignField: 'id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $group: {
            _id: '$product_id',
            productName: { $first: '$product.name' },
            productImage: { $first: '$product.image_url' },
            totalQuantity: { $sum: '$quantity' },
            totalRevenue: { $sum: { $multiply: ['$price', '$quantity'] } }
          }
        },
        {
          $sort: { totalQuantity: -1 }
        },
        {
          $limit: 10
        }
      ])

      // Thống kê tổng quan
      const totalUsers = await User.countDocuments({})
      const totalProducts = await Product.countDocuments({})
      const totalOrders = await Order.countDocuments({})
      const totalRevenue = await Order.aggregate([
        {
          $match: { status: 'Đã hoàn thành' }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ])

      // Chuẩn bị dữ liệu cho chart
      const chartData = {
        labels: [],
        revenue: [],
        orders: []
      }

      // Tạo dữ liệu cho tất cả các ngày trong tháng
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        chartData.labels.push(day)
        const dayData = dailyStats.find(d => d._id === day)
        const revenue = dayData ? (typeof dayData.revenue === 'object' ? parseFloat(dayData.revenue.toString()) : parseFloat(dayData.revenue)) : 0
        chartData.revenue.push(revenue)
        chartData.orders.push(dayData ? dayData.orders : 0)
      }

      // Xử lý dữ liệu Decimal128
      const processedMonthlyStats = monthlyStats[0] || { totalRevenue: 0, totalOrders: 0 }
      if (processedMonthlyStats.totalRevenue && typeof processedMonthlyStats.totalRevenue === 'object') {
        processedMonthlyStats.totalRevenue = parseFloat(processedMonthlyStats.totalRevenue.toString())
      }

      const processedTotalRevenue = totalRevenue[0]?.total || 0
      const finalTotalRevenue = typeof processedTotalRevenue === 'object' ? parseFloat(processedTotalRevenue.toString()) : processedTotalRevenue

            // Xử lý dữ liệu sản phẩm bán chạy
      const processedTopProducts = topProducts.map(product => {
        // Xử lý ảnh sản phẩm - lấy ảnh đầu tiên nếu có nhiều ảnh
        let productImage = product.productImage
        if (typeof productImage === 'string') {
          const imageArray = productImage
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url !== '')
          productImage = imageArray.length > 0 ? imageArray[0] : ''
        }

        return {
          ...product,
          productImage: productImage,
          totalRevenue: typeof product.totalRevenue === 'object' ? parseFloat(product.totalRevenue.toString()) : product.totalRevenue
        }
      })

      res.render('admin/dashboard', {
        showAdmin: true,
        selectedMonth: parseInt(selectedMonth),
        selectedYear: parseInt(selectedYear),
				startYear,
				currentYear,
        monthlyStats: processedMonthlyStats,
        chartData,
        topProducts: processedTopProducts,
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: finalTotalRevenue
      })
    } catch (error) {
      console.error('Dashboard error:', error)
      req.flash('error', 'Có lỗi xảy ra khi tải dashboard')
      res.redirect('/admin')
    }
  }

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
      .sort({ created_at: -1 })
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
      .sort({ created_at: -1 })
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
      .sort({ created_at: -1 })
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
