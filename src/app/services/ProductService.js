const Product = require('../models/Product')
const Category = require('../models/Category')
const Review = require('../models/Review')
const Favorite = require('../models/Favorite')
const AdminService = require('./AdminService')
const { getFirstImage, getProductRating } = require('../helpers/dataHelpers')

class ProductService {
  showProduct = async (page = 1, perPage = 15) => {
    const totalProducts = await Product.countDocuments({})
    const { totalPages, pages, skip } = AdminService.getPagination(
      totalProducts,
      page,
      perPage,
    )

    const products = await Product.find({}).skip(skip).limit(perPage).lean()
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
    return {
      products,
      currentPage: page,
      totalPages,
      pages,
    }
  }

  createProduct = async (data) => {
    const {
      category_id,
      name,
      description,
      price,
      stock,
      image_url,
      variant_type,
      variant_price,
      variant_stock,
    } = data
    const variantTypes = variant_type || []
    const variantPrices = variant_price || []
    const variantStocks = variant_stock || []
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
    if (
      category_id === '' &&
      name === '' &&
      description === '' &&
      price === '' &&
      stock === '' &&
      image_url === ''
    ) {
      return { error: 'Chưa nhập hết các mục!!!' }
    }
    try {
      const product = new Product({
        name,
        description,
        price,
        stock,
        category_id,
        image_url,
        variants,
      })
      await product.save()
      return { product }
    } catch (error) {
      return { error: 'Thêm thất bại!!!' }
    }
  }

  updateProduct = async (id, data) => {
    const {
      category_id,
      name,
      description,
      price,
      stock,
      image_url,
      variant_type,
      variant_price,
      variant_stock,
    } = data
    const variantTypes = variant_type || []
    const variantPrices = variant_price || []
    const variantStocks = variant_stock || []
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
    if (
      category_id === '' &&
      name === '' &&
      description === '' &&
      price === '' &&
      stock === '' &&
      image_url === ''
    ) {
      return { error: 'Chưa nhập hết các mục!!!' }
    }
    try {
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
      if (!updatedProduct) {
        return { error: 'Cập nhập thất bại!!!' }
      }
      return { product: updatedProduct }
    } catch (error) {
      return { error: 'Cập nhập thất bại!!!' }
    }
  }

  getProductWithCategory = async (id) => {
    try {
      const product = await Product.findOne(
        { id },
        {
          _id: 0,
          __v: 0,
        },
      ).lean()
      if (!product) {
        return { error: 'Product not found.' }
      }
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
        product.image_url = imageArray
      }
      return { product }
    } catch (error) {
      return { error: 'Failed to load product.' }
    }
  }

  getProductDetail = async (product_id, user_id) => {
    try {
      const product = await Product.findOne({ id: product_id }).lean()
      if (!product) {
        return { error: 'Sản phẩm không tồn tại' }
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
      const { rating, reviewCount } = await getProductRating(product_id)
      product.rating = rating
      product.reviewCount = reviewCount
      const reviews = await Review.aggregate([
        { $match: { product_id: product_id } },
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
      // Kiểm tra sản phẩm đã yêu thích chưa
      let isFavorited = false
      if (user_id) {
        const fav = await Favorite.findOne({
          user_id: user_id,
          product_id: product.id,
        })
        isFavorited = !!fav
      }
      const cartCount = await AdminService.countUserCarts(user_id)
      const orderCount = await AdminService.countProductOrders(product_id)
      const favoriteCount = await AdminService.countProductFavorites(product_id)
      return { product, isFavorited, cartCount, orderCount, favoriteCount }
    } catch (error) {
      return { error: 'Error in showProduct' }
    }
  }

  // FAVORITE LOGIC
  createFavorite = async (userId, product_id) => {
    const exists = await Favorite.findOne({ user_id: userId, product_id })
    if (exists) {
      return { error: 'Đã có trong yêu thích' }
    }
    await Favorite.create({ user_id: userId, product_id })
    const favoriteCount = await AdminService.countProductFavorites(product_id)
    return { success: true, favoriteCount }
  }

  destroyFavorite = async (userId, product_id) => {
    await Favorite.deleteOne({ user_id: userId, product_id })
    const favoriteCount = await AdminService.countProductFavorites(product_id)
    return { success: true, favoriteCount }
  }

  checkFavorite = async (userId, productId) => {
    const exists = await Favorite.findOne({
      user_id: userId,
      product_id: productId,
    })
    return { favorited: !!exists }
  }

  getProductForFavorite = async (userId, pageQuery, minPrice, maxPrice) => {
    if (!userId) {
      return { redirect: '/login' }
    }
    const page = parseInt(pageQuery) || 1
    const perPage = 12
    const totalFavorites = await Favorite.countDocuments({ user_id: userId })
    const { totalPages, pages, skip } = AdminService.getPagination(
      totalFavorites,
      page,
      perPage,
    )
    const FavoriteItems = await Favorite.find({ user_id: userId })
      .skip(skip)
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
    return {
      products,
      currentPage: page,
      totalPages,
      pages,
      minPrice,
      maxPrice,
    }
  }
}

module.exports = new ProductService()
