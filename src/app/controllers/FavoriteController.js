const Favorite = require('../models/Favorite')
const Product = require('../models/Product')
const User = require('../models/User')
const Review = require('../models/Review')
const { showCart } = require('./HomeController')
const Home = require('./HomeController')

class FavoriteController {
  index = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1
      const perPage = 15
      const totalFavorites = await Favorite.countDocuments({})
      const totalPages = Math.ceil(totalFavorites / perPage)

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

      const favorites = await Favorite.find({})
        .skip((page - 1) * perPage)
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
        createdAt: fav.createdAt ? fav.createdAt.toLocaleString('vi-VN') : '',
      }))
      res.render('admin/favorite/list', {
        favorites: data,
        showAdmin: true,
        currentPage: page,
        totalPages,
        pages,
      })
    } catch (err) {
      res.status(500).send('Lỗi lấy danh sách yêu thích')
    }
  }

  create = async (req, res) => {
    try {
      const userId = req.session.userId
      const product_id = req.params.productId
      const exists = await Favorite.findOne({
        user_id: userId,
        product_id: product_id,
      })
      if (exists) {
        return res.status(400).json({ message: 'Đã có trong yêu thích' })
      }
      await Favorite.create({ user_id: userId, product_id: product_id })
      const favoriteCount = await Home.countProductFavorites(product_id)
      res.json({ success: true, favoriteCount })
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  destroy = async (req, res) => {
    try {
      const userId = req.session.userId
      const product_id = req.params.productId
      await Favorite.deleteOne({ user_id: userId, product_id: product_id })
      const favoriteCount = await Home.countProductFavorites(product_id)
      console.log(
        '🚀 ~ FavoriteController ~ destroy= ~ favoriteCount:',
        favoriteCount,
      )
      res.json({ success: true, favoriteCount })
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  checkFavorite = async (req, res) => {
    try {
      const userId = req.session.userId
      const productId = req.params.productId
      const exists = await Favorite.findOne({
        user_id: userId,
        product_id: productId,
      })
      res.json({ favorited: !!exists })
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  userFavorite = async (req, res) => {
    try {
      const userId = req.session.userId
      if (!userId) {
        return res.redirect('/login')
      }
      const { page: pageQuery, minPrice, maxPrice } = req.query
      const page = parseInt(pageQuery) || 1
      const perPage = 12
      const totalFavorites = await Favorite.countDocuments({ user_id: userId })
      const totalPages = Math.ceil(totalFavorites / perPage)
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
      const FavoriteItems = await Favorite.find({ user_id: userId })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .lean()
      const productIds = FavoriteItems.map((item) => item.product_id)
      let products = await Product.find({ id: { $in: productIds } }).lean()
      // Lọc theo khoảng giá nếu có
      if (minPrice || maxPrice) {
        products = products.filter((product) => {
          let price = product.price
          if (product.variants && product.variants.length > 0) {
            price = product.variants[0].price
          }
          if (minPrice && price < parseInt(minPrice)) return false
          if (maxPrice && price > parseInt(maxPrice)) return false
          return true
        })
      }
      for (let product of products) {
        const ratingData = await Review.aggregate([
          { $match: { product_id: product.id } },
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
      res.render('favorite', {
        showCart: true,
        products,
        currentPage: page,
        totalPages,
        pages,
        minPrice,
        maxPrice,
      })
    } catch (err) {
      res.status(500).send('Lỗi lấy danh sách sản phẩm yêu thích')
    }
  }
}

module.exports = new FavoriteController()
