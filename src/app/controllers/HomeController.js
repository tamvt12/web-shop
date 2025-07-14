const HomeService = require('../services/HomeService')

class HomeController {
  home = async (req, res) => {
    const user_id = req.session.userId
    const { categories, orderCount, cartCount } = await HomeService.getHomeData(
      user_id,
    )
    res.render('home', {
      showSearch: true,
      categories,
      orderCount,
      cartCount,
    })
  }

  showStore = async (req, res) => {
    const user_id = req.session.userId
    const data = await HomeService.getStoreData(user_id, req.query)
    res.render('store', {
      showSearch: true,
      ...data,
    })
  }

  search = async (req, res) => {
    const user_id = req.session.userId
    const data = await HomeService.getSearchData(user_id, req.query)
    res.render('store', {
      showSearch: true,
      ...data,
    })
  }

  addCart = async (req, res) => {
    const userId = req.session.userId
    const result = await HomeService.addToCart(userId, req.body)
    if (result.error) {
      return res.json({ error: result.error })
    }
    res.json(result)
  }

  buyNow = async (req, res) => {
    const userId = req.session.userId
    const result = await HomeService.buyNow(userId, req.body)
    if (result.error) {
      return res.json({ error: result.error })
    }
    res.json(result)
  }

  async cart(user_id) {
    return await HomeService.getCart(user_id)
  }

  showCart = async (req, res, next) => {
    const user_id = req.session.userId
    const { cart_items, total } = await HomeService.getCart(user_id)
    res.render('cart', {
      cart_items,
      total,
    })
  }

  updateCart = async (req, res) => {
    const user_id = req.session.userId
    const result = await HomeService.updateCartItem(user_id, req.body)
    if (result.error) {
      return res.json({ error: result.error })
    }
    res.json(result)
  }

  deleteCart = async (req, res) => {
    const id = req.params.id
    const user_id = req.session.userId
    const result = await HomeService.deleteCartItem(user_id, id)
    if (result.error) {
      return res.json({ error: result.error })
    }
    res.json(result)
  }

  getCheckout = async (req, res) => {
    const user_id = req.session.userId
    const result = await HomeService.getCheckoutData(user_id)
    if (result.redirect) {
      return res.redirect(result.redirect)
    }
    res.render('checkout', {
      showCart: true,
      ...result,
    })
  }

  checkOut = async (req, res) => {
    const user_id = req.session.userId
    const result = await HomeService.processCheckout(user_id, req.body)
    if (result.error) {
      return res.status(400).json({ error: result.error })
    }
    res.json(result)
  }

  showOrder = async (req, res) => {
    const user_id = req.session.userId
    const result = await HomeService.getUserOrders(user_id)
    if (result.error) {
      return res.status(500).send('Đã xảy ra lỗi khi tải danh sách đơn hàng')
    }
    res.render('order', { ...result, showCart: true })
  }

  rating = async (req, res) => {
    const { product_ids, order_id, rating, comment } = req.body
    const user_id = req.session.userId
    try {
      await HomeService.rateProducts({
        user_id,
        product_ids,
        order_id,
        rating,
        comment,
      })
      res.json({ success: true })
    } catch (error) {
      console.error('Error in rating:', error)
      res.json({ success: false })
    }
  }

  cancelOrder = async (req, res) => {
    const orderId = req.params.id
    const userId = req.session.userId
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập',
      })
    }
    try {
      await HomeService.cancelOrder({ orderId, userId })
      res.json({
        success: true,
        message: 'Đã hủy đơn hàng thành công',
      })
    } catch (error) {
      console.error('Error canceling order:', error)
      res.status(400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi hủy đơn hàng',
      })
    }
  }
}

module.exports = new HomeController()
