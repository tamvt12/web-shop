const Product = require('../models/Product')
const Category = require('../models/Category')
const ProductService = require('../services/ProductService')

class ProductController {
  index = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    const {
      products,
      currentPage,
      totalPages,
      pages,
    } = await ProductService.showProduct(page, perPage)
    res.render('admin/product/list', {
      showAdmin: true,
      products,
      currentPage,
      totalPages,
      pages,
    })
  }

  create = (req, res, next) => {
    Category.find({})
      .lean()
      .then((categories) => {
        res.render('admin/product/add', {
          showAdmin: true,
          categories,
        })
      })
      .catch(next)
  }

  store = async (req, res) => {
    const result = await ProductService.createProduct(req.body)
    if (result.error) {
      req.flash('error', result.error)
      return res.redirect('/admin/product/add')
    }
    res.redirect('/admin/product/list')
  }

  show = async (req, res) => {
    const result = await ProductService.getProductWithCategory(req.params.id)
    if (result.error) {
      req.flash('error', 'Failed to load product.')
      return res.redirect('/admin')
    }
    const categories = await Category.find({}).lean()
    res.render('admin/product/edit', {
      product: result.product,
      categories,
      showAdmin: true,
      messages: req.flash(),
    })
  }

  update = async (req, res) => {
    const id = req.params.id
    const result = await ProductService.updateProduct(id, req.body)
    const referer = req.get('Referer')
    if (result.error) {
      req.flash('error', result.error)
      return res.redirect(referer)
    }
    res.redirect('/admin/product/list')
  }

  destroy = async (req, res) => {
    try {
      const id = req.params.id
      await Product.findOneAndDelete({ id })
      res.json({ success: true, message: 'Xóa thành công' })
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi xóa',
      })
    }
  }

  showDetail = async (req, res) => {
    const product_id = Number(req.params.id)
    const user_id = req.session.userId
    const result = await ProductService.getProductDetail(product_id, user_id)
    if (result.error) {
      return res
        .status(404)
        .render('404', { message: 'Sản phẩm không tồn tại' })
    }

    res.render('product-detail', {
      showCart: true,
      ...result,
    })
  }

  createFavorite = async (req, res) => {
    try {
      const userId = req.session.userId
      const product_id = req.params.productId
      const result = await ProductService.createFavorite(userId, product_id)
      if (result.error) {
        return res.status(400).json({ message: result.error })
      }
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  destroyFavorite = async (req, res) => {
    try {
      const userId = req.session.userId
      const product_id = req.params.productId
      const result = await ProductService.destroyFavorite(userId, product_id)
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  checkFavorite = async (req, res) => {
    try {
      const userId = req.session.userId
      const productId = req.params.productId
      const result = await ProductService.checkFavorite(userId, productId)
      res.json(result)
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  getProductForFavorite = async (req, res) => {
    try {
      const userId = req.session.userId
      const { page: pageQuery, minPrice, maxPrice } = req.query
      const result = await ProductService.getProductForFavorite(
        userId,
        pageQuery,
        minPrice,
        maxPrice,
      )
      if (result.redirect) {
        return res.redirect(result.redirect)
      }
      res.render('favorite', {
        showCart: true,
        ...result,
      })
    } catch (err) {
      res.status(500).send('Lỗi lấy danh sách sản phẩm yêu thích')
    }
  }
}

module.exports = new ProductController()
