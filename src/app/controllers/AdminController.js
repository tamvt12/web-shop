const Order = require('../models/Order')
const Order_Item = require('../models/Order_Item')
const Product = require('../models/Product')
const User = require('../models/User')
const AdminService = require('../services/AdminService')

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
    const {
      orders,
      currentPage,
      totalPages,
      pages,
    } = await AdminService.showOrder(page, perPage)

    res.render('admin/order/list', {
      showAdmin: true,
      orders,
      currentPage,
      totalPages,
      pages,
    })
  }

  editOrder = async (req, res) => {
    try {
      const { order, status } = await AdminService.editOrder(req.params.id)
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
      const updatedOrder = await AdminService.updateOrder(id, status)
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
    const {
      cartItems,
      currentPage,
      totalPages,
      pages,
    } = await AdminService.showCartItem(page, perPage)

    res.render('admin/cart-item/list', {
      showAdmin: true,
      cartItems,
      currentPage,
      totalPages,
      pages,
    })
  }

  showOrderItem = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const {
      orderItems,
      currentPage,
      totalPages,
      pages,
    } = await AdminService.showOrderItem(page, perPage)

    res.render('admin/order-item/list', {
      showAdmin: true,
      orderItems,
      currentPage,
      totalPages,
      pages,
    })
  }

  showReview = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const {
      reviews,
      currentPage,
      totalPages,
      pages,
    } = await AdminService.showReview(page, perPage)

    res.render('admin/review/list', {
      showAdmin: true,
      reviews,
      currentPage,
      totalPages,
      pages,
    })
  }

  showFavorite = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const {
      favorites,
      currentPage,
      totalPages,
      pages,
    } = await AdminService.showFavorite(page, perPage)

    res.render('admin/favorite/list', {
      showAdmin: true,
      favorites,
      currentPage,
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

  // CATEGORY CONTROLLER
  categoryList = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    try {
      const {
        categories,
        currentPage,
        totalPages,
        pages,
      } = await AdminService.getCategories(page, perPage)
      res.render('admin/category/list', {
        showAdmin: true,
        categories,
        currentPage,
        totalPages,
        pages,
      })
    } catch (error) {
      next(error)
    }
  }

  categoryAdd = (req, res) => {
    res.render('admin/category/add', {
      showAdmin: true,
      messages: req.flash(),
    })
  }

  categoryStore = async (req, res) => {
    const { name, image_url } = req.body
    try {
      await AdminService.createCategory({ name, image_url })
      res.redirect('/admin/category/list')
    } catch (error) {
      req.flash('error', error.message || 'Thêm thất bại!!!')
      res.redirect('/admin/category/add')
    }
  }

  categoryEdit = async (req, res) => {
    try {
      const category = await AdminService.getCategoryById(req.params.id)
      res.render('admin/category/edit', {
        category,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load category.')
      res.redirect('/admin')
    }
  }

  categoryUpdate = async (req, res) => {
    const { name, image_url } = req.body
    const id = req.params.id
    try {
      const updatedCategory = await AdminService.updateCategory(id, {
        name,
        image_url,
      })
      if (updatedCategory) {
        res.redirect('/admin/category/list')
      } else {
        req.flash('error', 'Cập nhập thất bại!!!')
        const referer = req.get('Referer')
        res.redirect(referer)
      }
    } catch (error) {
      req.flash('error', error.message || 'Cập nhập thất bại!!!')
      const referer = req.get('Referer')
      res.redirect(referer)
    }
  }

  categoryDestroy = async (req, res) => {
    try {
      const id = req.params.id
      await Category.findOneAndDelete({ id })
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }
}

module.exports = new AdminController()
