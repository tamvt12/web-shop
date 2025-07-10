const Product = require('../models/Product')
const Category = require('../models/Category')
const Review = require('../models/Review')
const Home = require('./HomeController')
const Favorite = require('../models/Favorite')

class ProductController {
  index = (req, res, next) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    Product.countDocuments({})
      .then(async (totalProducts) => {
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

        const products = await Product.find({})
          .skip((page - 1) * perPage)
          .limit(perPage)
          .lean()
        for (let product of products) {
          const category = await Category.findOne(
            { id: product.category_id },
            {
              name: 1,
              _id: 0,
            },
          ).lean()
          product.category_name = category ? category.name : ''
          if (typeof product.image_url === 'string') {
            const imageArray = product.image_url
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url !== '')
            product.image_url = imageArray.length > 0 ? imageArray[0] : ''
          }
        }
        res.render('admin/product/list', {
          showAdmin: true,
          products,
          currentPage: page,
          totalPages,
          pages,
        })
      })
      .catch(next)
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

  store = (req, res) => {
    const { category_id, name, description, price, stock, image_url } = req.body
    const variantTypes = req.body.variant_type || []
    const variantPrices = req.body.variant_price || []
    const variantStocks = req.body.variant_stock || []
    let variants = []
    if (Array.isArray(variantTypes)) {
      for (let i = 0; i < variantTypes.length; i++) {
        if (variantTypes[i] && variantPrices[i]) {
          variants.push({
            type: variantTypes[i],
            price: variantPrices[i],
            stock: variantStocks[i] || 0,
          })
        }
      }
    } else if (variantTypes && variantPrices) {
      variants.push({
        type: variantTypes,
        price: variantPrices,
        stock: variantStocks || 0,
      })
    }
    try {
      if (
        category_id === '' &&
        name === '' &&
        description === '' &&
        price === '' &&
        stock === '' &&
        image_url === ''
      ) {
        req.flash('error', 'Chưa nhập hết các mục!!!')
        return res.redirect('/admin/product/add')
      }

      const product = new Product({
        name,
        description,
        price,
        stock,
        category_id,
        image_url,
        variants,
      })
      product.save()
      res.redirect('/admin/product/list')
    } catch (error) {
      req.flash('error', 'Thêm thất bại!!!')
      return res.redirect('/admin/product/add')
    }
  }

  show = async (req, res) => {
    try {
      const product = await Product.findOne(
        { id: req.params.id },
        {
          _id: 0,
          __v: 0,
        },
      ).lean()
      const category = await Category.findOne(
        { id: product.category_id },
        {
          name: 1,
          _id: 0,
        },
      ).lean()
      product.category_name = category ? category.name : ''

      // Convert image_url string to array
      if (typeof product.image_url === 'string') {
        const imageArray = product.image_url
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url !== '')
        product.image_url = imageArray
      }

      const categories = await Category.find({}).lean()
      res.render('admin/product/edit', {
        product,
        categories,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load product.')
      res.redirect('/admin')
    }
  }

  update = async (req, res) => {
    const { category_id, name, description, price, stock, image_url } = req.body
    const id = req.params.id
    // Lấy variants từ form
    const variantTypes = req.body.variant_type || []
    const variantPrices = req.body.variant_price || []
    const variantStocks = req.body.variant_stock || []
    let variants = []
    if (Array.isArray(variantTypes)) {
      for (let i = 0; i < variantTypes.length; i++) {
        if (variantTypes[i] && variantPrices[i]) {
          variants.push({
            type: variantTypes[i],
            price: variantPrices[i],
            stock: variantStocks[i] || 0,
          })
        }
      }
    } else if (variantTypes && variantPrices) {
      variants.push({
        type: variantTypes,
        price: variantPrices,
        stock: variantStocks || 0,
      })
    }
    try {
      if (
        category_id === '' &&
        name === '' &&
        description === '' &&
        price === '' &&
        stock === '' &&
        image_url === ''
      ) {
        req.flash('error', 'Chưa nhập hết các mục!!!')
        const referer = req.get('Referer')
        res.redirect(referer)
      }
      const updatedProduct = await Product.findOneAndUpdate(
        { id },
        {
          name,
          description,
          price,
          stock,
          category_id,
          image_url,
          variants,
        },
      )
      if (updatedProduct) {
        res.redirect('/admin/product/list')
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
    try {
      const productId = Number(req.params.id)
      const user_id = req.session.userId

      // Get product details
      const product = await Product.findOne({ id: productId }).lean()

      if (!product) {
        return res
          .status(404)
          .render('404', { message: 'Sản phẩm không tồn tại' })
      }

      // Get category
      const category = await Category.findOne({
        id: product.category_id,
      }).lean()
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
        { $match: { product_id: productId } },
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
        { $match: { product_id: productId } },
        {
          $lookup: {
            from: 'users',
            localField: 'user_id',
            foreignField: 'id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
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
      const cartCount = await Home.countUserCarts(user_id)
      const orderCount = await Home.countUserOrders(user_id)
      // Kiểm tra sản phẩm đã yêu thích chưa
      let isFavorited = false
      if (user_id) {
        const fav = await Favorite.findOne({
          user_id: user_id,
          product_id: product.id,
        })
        isFavorited = !!fav
      }
      res.render('product-detail', {
        showCart: true,
        product,
        cartCount,
        orderCount,
        isFavorited,
      })
    } catch (error) {
      console.error('Error in showProduct:', error)
    }
  }
}

module.exports = new ProductController()
