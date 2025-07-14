const Cart_Item = require('../models/Cart_Item')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Order_Item = require('../models/Order_Item')
const Review = require('../models/Review')
const Category = require('../models/Category')
const Favorite = require('../models/Favorite')

class HomeController {
  async countUserOrders(user_id) {
    if (!user_id) {
      return 0
    }
    const orderCount = await Order.countDocuments({ user_id })
    return orderCount
  }

  async countProductOrders(product_id) {
    if (!product_id) {
      return 0
    }
    const orderCount = await Order_Item.countDocuments({ product_id })
    return orderCount
  }

  async countProductFavorites(product_id) {
    if (!product_id) {
      return 0
    }
    const favoriteCount = await Favorite.countDocuments({ product_id })
    return favoriteCount
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
      let products = await Product.find({ category_id: cat.id })
        .limit(10)
        .lean()
      // Tính rating cho từng sản phẩm
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
        id: cat.id,
        name: cat.name,
        image_url: cat.image_url,
        products,
      })
    }

    res.render('home', {
      showSearch: true,
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

    if (categoryId) {
      currentCategory = await Category.findOne({
        id: parseInt(categoryId),
      }).lean()
    }

    res.render('store', {
      showSearch: true,
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
    const { search, minPrice, maxPrice } = req.query
    const page = parseInt(req.query.page) || 1
    const perPage = 12
    const user_id = req.session.userId
    const cartCount = await this.countUserCarts(user_id)
    const orderCount = await this.countUserOrders(user_id)

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

    const products = await Product.find(productQuery)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .lean()

    for (let product of products) {
      const ratingData = await Review.aggregate([
        {
          $match: { product_id: product.id },
        },
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

    res.render('store', {
      showSearch: true,
      products,
      orderCount,
      cartCount,
      search,
      currentPage: page,
      totalPages: totalPages,
      pages: pages,
      minPrice,
      maxPrice,
      layout: 'main',
    })
  }

  addCart = (req, res) => {
    const productId = parseInt(req.body.id)
    const variantType = req.body.variantType
    const quantity = parseInt(req.body.quantity) || 1
    const userId = req.session.userId

    if (!userId) {
      return res.json({ error: 'Unauthorized' })
    }

    Product.findOne({ id: productId })
      .then(async (product) => {
        let message = ''
        if (!product) {
          message = 'Sản phẩm không tồn tại'
          return res.json({ error: message })
        }

        let stock = product.stock
        if (variantType && product.variants && product.variants.length) {
          const variant = product.variants.find((v) => v.type === variantType)
          if (!variant) {
            return res.json({ error: 'Loại sản phẩm không tồn tại' })
          }
          stock = variant.stock
        }

        if (stock <= 0) {
          message = 'Sản phẩm đã hết hàng'
          return res.json({ error: message })
        }

        let cartQuery = { user_id: userId, product_id: productId }
        if (variantType) cartQuery.variant_type = variantType
        let cartItem = await Cart_Item.findOne(cartQuery)

        if (cartItem) {
          const newQuantity = cartItem.quantity + quantity
          if (newQuantity > stock) {
            message = 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn'
            return res.json({ error: message })
          }
          cartItem.quantity = newQuantity
          await cartItem.save()
        } else {
          if (quantity > stock) {
            message = 'Số lượng sản phẩm vượt quá số lượng có sẵn'
            return res.json({ error: message })
          }
          cartItem = await Cart_Item.create({
            user_id: userId,
            product_id: productId,
            variant_type: variantType || null,
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
      const product = await Product.findOne({ id: productId })

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
            if (variant) {
              price = variant.price
            }
          }
          cart_item.total = cart_item.quantity * price
          total += cart_item.total
        }
      }
      return { cart_items, total }
    } catch (err) {
      return { cart_items: [], total: 0 }
    }
  }

  showCart = async (req, res, next) => {
    const user_id = req.session.userId
    const { cart_items, total } = await this.cart(user_id)

    res.render('cart', {
      cart_items,
      total,
    })
    // res.json({ cart_items })
  }

  updateCart = async (req, res) => {
    const { id, quantity, variant_type } = req.body
    const user_id = req.session.userId

    if (!user_id) {
      return res.json({ error: 'Unauthorized' })
    }

    try {
      let message = ''
      const cartItem = await Cart_Item.findOne({
        id,
        user_id,
      })

      if (!cartItem) {
        return res.json({ error: 'Cart item not found' })
      }

      const product = await Product.findOne({ id: cartItem.product_id })
      if (!product) {
        message = 'Sản phẩm không tồn tại'
      }

      // Nếu có variant_type mới, kiểm tra và cập nhật
      if (variant_type) {
        // Kiểm tra variant_type có hợp lệ không
        const variant = (product.variants || []).find(
          (v) => v.type === variant_type,
        )
        if (!variant) {
          return res.json({ error: 'Loại sản phẩm không tồn tại' })
        }
        cartItem.variant_type = variant_type
      }

      // Nếu có quantity, kiểm tra và cập nhật
      if (quantity !== undefined) {
        // Nếu có variant_type mới thì kiểm tra stock của variant đó
        let stock = product.stock
        if (cartItem.variant_type && Array.isArray(product.variants)) {
          const variant = product.variants.find(
            (v) => v.type === cartItem.variant_type,
          )
          if (variant) {
            stock = variant.stock
          }
        }
        if (quantity > stock) {
          message = 'Số lượng sản phẩm trong giỏ hàng đã đạt giới hạn'
        }
        if (message === '') {
          cartItem.quantity = quantity
        }
      }
      if (message === '') {
        await cartItem.save()
      }
      const cartCount = await this.countUserCarts(user_id)
      const { cart_items, total } = await this.cart(user_id)
      res.json({ cart_items, quantity: cartItem.quantity, cartCount, total })
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
      const deletedItem = await Cart_Item.findOneAndDelete({ id })
      if (!deletedItem) {
        return (message = 'Sản phẩm không tồn tại trong giỏ hàng')
      }

      const cartCount = await this.countUserCarts(user_id)
      const orderCount = await this.countUserOrders(user_id)
      const { cart_items, total } = await this.cart(user_id)

      res.json({ cart_items, cartCount, orderCount, total })
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm từ giỏ hàng:', error)
      res.status(500).json({
        error: 'Đã xảy ra lỗi khi xóa sản phẩm từ giỏ hàng',
      })
    }
  }

  getCheckout = async (req, res) => {
    const user_id = req.session.userId
    const { cart_items, total } = await this.cart(user_id)
    const cartCount = await this.countUserCarts(user_id)
    if (!cart_items || cart_items.length === 0) {
      return res.redirect('/cart')
    }
    res.render('checkout', {
      showCart: true,
      cart_items,
      total,
      cartCount,
    })
  }

  checkOut = async (req, res) => {
    const user_id = req.session.userId
    // Lấy thông tin từ form
    const { name, phone, address, shipping, payment } = req.body
    try {
      // Lấy tất cả item trong giỏ hàng của user
      const cartItems = await Cart_Item.find({ user_id }).lean()
      if (!cartItems || cartItems.length === 0) {
        return res.status(400).json({ error: 'Giỏ hàng của bạn đang trống.' })
      }
      // Lấy danh sách id sản phẩm duy nhất
      const productIds = [...new Set(cartItems.map((item) => item.product_id))]
      // Lấy thông tin sản phẩm dựa vào id tự tạo
      const products = await Product.find({ id: { $in: productIds } }).lean()
      const cartItemsWithProduct = cartItems.map((item) => {
        const product = products.find((p) => p.id == item.product_id)
        return {
          ...item,
          product: product || null,
        }
      })
      // Tính tổng tiền
      let total = 0
      for (const cartItem of cartItemsWithProduct) {
        if (!cartItem.product) continue
        let price = cartItem.product.price
        let variantName = null
        // Nếu có variant_type, lấy giá của loại sản phẩm đó
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
      // Tạo order, thêm các trường mới
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
      // Tạo các order item
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
      // Cập nhật tồn kho sản phẩm
      for (const item of cartItemsWithProduct) {
        if (!item.product) continue
        // Nếu có variant_type và sản phẩm có variants
        if (item.variant_type && Array.isArray(item.product.variants)) {
          // Tìm index của variant cần cập nhật
          const variantIndex = item.product.variants.findIndex(
            (v) => v.type === item.variant_type,
          )
          if (variantIndex !== -1) {
            // Giảm stock của variant đó
            const updateKey = `variants.${variantIndex}.stock`
            await Product.findOneAndUpdate(
              { id: item.product.id },
              { $inc: { [updateKey]: -item.quantity } },
            )
          }
        } else {
          // Nếu không có variant, giảm stock tổng
          await Product.findOneAndUpdate(
            { id: item.product.id },
            { $inc: { stock: -item.quantity } },
          )
        }
      }
      // Xóa giỏ hàng
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
      res.render('order', { orders, cartCount, orderCount, showCart: true })
    } catch (error) {
      res.status(500).send('Đã xảy ra lỗi khi tải danh sách đơn hàng')
    }
  }
}

module.exports = new HomeController()
