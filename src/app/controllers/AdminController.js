const AdminService = require('../services/AdminService')

class AdminController {
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
