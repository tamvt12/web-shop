const Cart_Item = require('../models/Cart_Item')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Order_Item = require('../models/Order_Item')
const Review = require('../models/Review')
const Category = require('../models/Category')
const AdminService = require('./AdminService')
const { getFirstImage, getProductRating } = require('../helpers/dataHelpers')

class HomeService {
  getHomeData = async (user_id) => {
    const cartCount = await AdminService.countUserCarts(user_id)
    const orderCount = await AdminService.countUserOrders(user_id)
    const categoriesRaw = await Category.find({}).lean()
    const categories = []
    for (let cat of categoriesRaw) {
      let products = await Product.find({ category_id: cat.id })
        .limit(10)
        .lean()
      await Promise.all(
        products.map(async (product) => {
          product.image_url = getFirstImage(product.image_url)
          const { rating, reviewCount } = await getProductRating(product.id)
          product.rating = rating
          product.reviewCount = reviewCount
        }),
      )
      categories.push({
        id: cat.id,
        name: cat.name,
        image_url: cat.image_url,
        products,
      })
    }
    return { categories, orderCount, cartCount }
  }

  getStoreData = async (user_id, query) => {
    const { category: categoryId, page: pageQuery, minPrice, maxPrice } = query
    const page = parseInt(pageQuery) || 1
    const perPage = 12
    const cartCount = await AdminService.countUserCarts(user_id)
    const orderCount = await AdminService.countUserOrders(user_id)
    const allCategories = await Category.find({}).lean()
    let currentCategory = null
    const productQuery = {}
    if (categoryId) {
      productQuery.category_id = parseInt(categoryId)
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
    const { totalPages, pages, skip } = AdminService.getPagination(
      totalProducts,
      page,
      perPage,
    )
    const products = await Product.find(productQuery)
      .skip(skip)
      .limit(perPage)
      .lean()
    await Promise.all(
      products.map(async (product) => {
        product.image_url = getFirstImage(product.image_url)
        const { rating, reviewCount } = await getProductRating(product.id)
        product.rating = rating
        product.reviewCount = reviewCount
      }),
    )
    if (categoryId) {
      currentCategory = await Category.findOne({
        id: parseInt(categoryId),
      }).lean()
    }
    return {
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
    }
  }

  getSearchData = async (user_id, query) => {
    const { search, minPrice, maxPrice, page: pageQuery } = query
    const page = parseInt(pageQuery) || 1
    const perPage = 12
    const cartCount = await AdminService.countUserCarts(user_id)
    const orderCount = await AdminService.countUserOrders(user_id)
    const productQuery = {
      name: { $regex: new RegExp(search, 'i') },
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
    const { totalPages, pages, skip } = AdminService.getPagination(
      totalProducts,
      page,
      perPage,
    )
    const products = await Product.find(productQuery)
      .skip(skip)
      .limit(perPage)
      .lean()
    await Promise.all(
      products.map(async (product) => {
        product.image_url = getFirstImage(product.image_url)
        const { rating, reviewCount } = await getProductRating(product.id)
        product.rating = rating
        product.reviewCount = reviewCount
      }),
    )
    return {
      products,
      orderCount,
      cartCount,
      search,
      currentPage: page,
      totalPages: totalPages,
      pages: pages,
      minPrice,
      maxPrice,
    }
  }

  addToCart = async (userId, body) => {
    const productId = parseInt(body.id)
    const variantType = body.variantType
    const quantity = parseInt(body.quantity) || 1
    if (!userId) return { error: 'Unauthorized' }
    const product = await Product.findOne({ id: productId })
    if (!product) return { error: 'Sản phẩm không tồn tại' }
    let stock = product.stock
    if (variantType && product.variants && product.variants.length) {
      const variant = product.variants.find((v) => v.type === variantType)
      if (!variant) return { error: 'Loại sản phẩm không tồn tại' }
      stock = variant.stock
    }
    if (stock <= 0) return { error: 'Sản phẩm đã hết hàng' }
    let cartQuery = { user_id: userId, product_id: productId }
    if (variantType) cartQuery.variant_type = variantType
    let cartItem = await Cart_Item.findOne(cartQuery)
    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity
      if (newQuantity > stock)
        return { error: 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn' }
      cartItem.quantity = newQuantity
      await cartItem.save()
    } else {
      if (quantity > stock)
        return { error: 'Số lượng sản phẩm vượt quá số lượng có sẵn' }
      cartItem = await Cart_Item.create({
        user_id: userId,
        product_id: productId,
        variant_type: variantType || null,
        quantity: quantity,
      })
    }
    const cartCount = await AdminService.countUserCarts(userId)
    const orderCount = await AdminService.countUserOrders(userId)
    return {
      success: true,
      message: 'Thêm vào giỏ hàng thành công',
      cartCount,
      orderCount,
    }
  }

  buyNow = async (userId, body) => {
    const productId = body.id
    const quantity = parseInt(body.quantity) || 1
    if (!userId) return { error: 'Unauthorized' }
    const product = await Product.findOne({ id: productId })
    if (!product) return { error: 'Sản phẩm không tồn tại' }
    if (product.stock <= 0) return { error: 'Sản phẩm đã hết hàng' }
    if (quantity > product.stock)
      return { error: 'Số lượng sản phẩm vượt quá số lượng có sẵn' }
    let cartItem = await Cart_Item.findOne({
      user_id: userId,
      product_id: productId,
    })
    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity
      if (newQuantity > product.stock)
        return { error: 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn' }
      cartItem.quantity = newQuantity
      await cartItem.save()
    } else {
      cartItem = await Cart_Item.create({
        user_id: userId,
        product_id: productId,
        quantity: quantity,
      })
    }
    const cartCount = await AdminService.countUserCarts(userId)
    const orderCount = await AdminService.countUserOrders(userId)
    return {
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      redirectUrl: '/cart',
      cartCount,
      orderCount,
    }
  }

  getCart = async (user_id) => {
    try {
      const cart_items = await Cart_Item.find({ user_id }).lean()
      let total = 0
      for (let cart_item of cart_items) {
        const product = await Product.findOne({
          id: cart_item.product_id,
        }).lean()
        if (product) {
          if (typeof product.image_url === 'string') {
            const imageArray = product.image_url
              .split(',')
              .map((url) => url.trim())
              .filter((url) => url !== '')
            product.image_url = imageArray
          }
          cart_item.product = product
          cart_item.variants = product.variants || []
          if (cart_item.variant_type) {
            cart_item.variant_type = cart_item.variant_type
          }
          let price = 0
          if (cart_item.variant_type && Array.isArray(product.variants)) {
            const variant = product.variants.find(
              (v) => v.type === cart_item.variant_type,
            )
            if (variant) price = variant.price
          }
          console.log('🚀 ~ HomeService ~ getCart= ~ price:', price)
          console.log(
            '🚀 ~ HomeService ~ getCart= ~ price:',
            cart_item.quantity,
          )
          cart_item.total = cart_item.quantity * price
          total += cart_item.total
          console.log('🚀 ~ HomeService ~ getCart= ~ total:', total)
        }
      }
      return { cart_items, total }
    } catch (err) {
      return { cart_items: [], total: 0 }
    }
  }

  updateCartItem = async (user_id, body) => {
    const { id, quantity, variant_type } = body
    let message = ''
    const cartItem = await Cart_Item.findOne({ id, user_id })
    if (!cartItem) return { error: 'Cart item not found' }
    const product = await Product.findOne({ id: cartItem.product_id })
    if (!product) message = 'Sản phẩm không tồn tại'
    if (variant_type) {
      const variant = (product.variants || []).find(
        (v) => v.type === variant_type,
      )
      if (!variant) return { error: 'Loại sản phẩm không tồn tại' }
      cartItem.variant_type = variant_type
    }
    if (quantity !== undefined) {
      let stock = product.stock
      if (cartItem.variant_type && Array.isArray(product.variants)) {
        const variant = product.variants.find(
          (v) => v.type === cartItem.variant_type,
        )
        if (variant) stock = variant.stock
      }
      if (quantity > stock)
        message = 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn'
      if (message === '') cartItem.quantity = quantity
    }
    if (message === '') await cartItem.save()
    const cartCount = await AdminService.countUserCarts(user_id)
    const { cart_items, total } = await this.getCart(user_id)
    return { cart_items, quantity: cartItem.quantity, cartCount, total }
  }

  deleteCartItem = async (user_id, id) => {
    const deletedItem = await Cart_Item.findOneAndDelete({ id })
    if (!deletedItem) return { error: 'Sản phẩm không tồn tại trong giỏ hàng' }
    const cartCount = await AdminService.countUserCarts(user_id)
    const orderCount = await AdminService.countUserOrders(user_id)
    const { cart_items, total } = await this.getCart(user_id)
    return { cart_items, cartCount, orderCount, total }
  }

  getCheckoutData = async (user_id) => {
    const { cart_items, total } = await this.getCart(user_id)
    const cartCount = await AdminService.countUserCarts(user_id)
    if (!cart_items || cart_items.length === 0) return { redirect: '/cart' }
    return { cart_items, total, cartCount }
  }

  processCheckout = async (user_id, body) => {
    const { name, phone, address, shipping, payment } = body
    const cartItems = await Cart_Item.find({ user_id }).lean()
    if (!cartItems || cartItems.length === 0)
      return { error: 'Giỏ hàng của bạn đang trống.' }
    const productIds = [...new Set(cartItems.map((item) => item.product_id))]
    const products = await Product.find({ id: { $in: productIds } }).lean()
    const cartItemsWithProduct = cartItems.map((item) => {
      const product = products.find((p) => p.id == item.product_id)
      return { ...item, product: product || null }
    })
    let total = 0
    for (const cartItem of cartItemsWithProduct) {
      if (!cartItem.product) continue
      let price = cartItem.product.price
      let variantName = null
      if (cartItem.variant_type && Array.isArray(cartItem.product.variants)) {
        const variant = cartItem.product.variants.find(
          (v) => v.type === cartItem.variant_type,
        )
        if (variant) {
          price = variant.price
          variantName = variant.type
        }
      }
      cartItem._finalPrice = price
      cartItem._variantName = variantName
      total += price * cartItem.quantity
    }
    const order = new Order({
      user_id,
      total,
      status: 'Chờ xử lý',
      receiver_name: name,
      receiver_phone: phone,
      receiver_address: address,
      shipping_method: shipping,
      payment_method: payment,
    })
    const savedOrder = await order.save()
    const orderItems = []
    for (const cartItem of cartItemsWithProduct) {
      if (!cartItem.product) continue
      const orderItem = new Order_Item({
        order_id: savedOrder.id,
        product_id: cartItem.product.id,
        quantity: cartItem.quantity,
        price: cartItem._finalPrice,
        variant_type: cartItem._variantName,
      })
      orderItems.push(orderItem.save())
    }
    for (const item of cartItemsWithProduct) {
      if (!item.product) continue
      if (item.variant_type && Array.isArray(item.product.variants)) {
        const variantIndex = item.product.variants.findIndex(
          (v) => v.type === item.variant_type,
        )
        if (variantIndex !== -1) {
          const updateKey = `variants.${variantIndex}.stock`
          await Product.findOneAndUpdate(
            { id: item.product.id },
            { $inc: { [updateKey]: -item.quantity } },
          )
        }
      } else {
        await Product.findOneAndUpdate(
          { id: item.product.id },
          { $inc: { stock: -item.quantity } },
        )
      }
    }
    await Cart_Item.deleteMany({ user_id })
    const cartCount = await AdminService.countUserCarts(user_id)
    const orderCount = await AdminService.countUserOrders(user_id)
    const { cart_items } = await this.getCart(user_id)
    return {
      success: true,
      message: 'Đặt hàng thành công!',
      cartCount,
      orderCount,
      cart_items,
    }
  }

  getUserOrders = async (user_id) => {
    const cartCount = await AdminService.countUserCarts(user_id)
    const orderCount = await AdminService.countUserOrders(user_id)
    const orders = await Order.find({ user_id }).sort({ created_at: -1 }).lean()
    for (const order of orders) {
      const items = await Order_Item.find({ order_id: order.id }).lean()
      const existingReview = await Review.findOne({
        user_id: user_id,
        order_id: order.id,
      }).lean()
      if (existingReview) {
        order.userRating = existingReview.rating
        order.userComment = existingReview.comment
      } else {
        order.userRating = null
        order.userComment = null
      }
      for (const item of items) {
        item.product = await Product.findOne({ id: item.product_id }).lean()
        if (item.product && typeof item.product.image_url === 'string') {
          const imageArray = item.product.image_url
            .split(',')
            .map((url) => url.trim())
            .filter((url) => url !== '')
          item.product.image_url = imageArray
        }
      }
      order.order_Item = items
    }
    orders.sort((a, b) => {
      const statusOrder = {
        'Chờ xử lý': 1,
        'Đang giao': 2,
        'Đã hủy': 3,
        'Đã hoàn thành': 3,
      }
      return statusOrder[a.status] - statusOrder[b.status]
    })
    return { orders, cartCount, orderCount }
  }

  rateProducts = async ({
    user_id,
    product_ids,
    order_id,
    rating,
    comment,
  }) => {
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
    return true
  }

  cancelOrder = async ({ orderId, userId }) => {
    const order = await Order.findOne({ id: orderId, user_id: userId })
    if (!order) {
      throw new Error(
        'Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn hàng này',
      )
    }
    if (order.status !== 'Chờ xử lý') {
      throw new Error('Chỉ có thể hủy đơn hàng có trạng thái "Chờ xử lý"')
    }
    const orderItems = await Order_Item.find({ order_id: orderId })
    for (const item of orderItems) {
      const product = await Product.findOne({ id: item.product_id })
      if (product) {
        if (item.variant_type && Array.isArray(product.variants)) {
          const variantIndex = product.variants.findIndex(
            (v) => v.type === item.variant_type,
          )
          if (variantIndex !== -1) {
            const updateKey = `variants.${variantIndex}.stock`
            await Product.findOneAndUpdate(
              { id: item.product_id },
              { $inc: { [updateKey]: item.quantity } },
            )
          }
        } else {
          await Product.findOneAndUpdate(
            { id: item.product_id },
            { $inc: { stock: item.quantity } },
          )
        }
      }
    }
    await Order.findOneAndUpdate(
      { id: orderId },
      { status: 'Đã hủy', updated_at: new Date() },
    )
    return true
  }
}

module.exports = new HomeService()
