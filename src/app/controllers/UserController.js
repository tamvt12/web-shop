const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Review = require('../models/Review')
const Order = require('../models/Order')
const Order_Item = require('../models/Order_Item')
const Product = require('../models/Product')

class UserController {
  index = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
    User.countDocuments({})
      .then(async (totalUsers) => {
        const totalPages = Math.ceil(totalUsers / perPage)
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

        const users = await User.find({})
          .skip((page - 1) * perPage)
          .limit(perPage)
          .lean()
        res.render('admin/user/list', {
          showAdmin: true,
          users,
          currentPage: page,
          totalPages,
          pages,
        })
      })
      .catch(next)
  }

  showLogin = (req, res) => {
    res.render('login', { showLogin: true, messages: req.flash() })
  }

  showRegister = (req, res) => {
    res.render('register', { showLogin: true, messages: req.flash() })
  }

  register = async (req, res) => {
    const { name, email, password, repeatPassword } = req.body

    if (name === '' || email === '' || password === '') {
      req.flash('error', 'Chưa nhập name, email hoặc mật khẩu!!!')
      return res.redirect('/register')
    }

    if (password.length < 6) {
      req.flash('error', 'Mật khẩu phải có độ dài ít nhất 6 ký tự!!!')
      return res.redirect('/register')
    }

    if (password !== repeatPassword) {
      req.flash('error', 'Nhập lại mật khẩu không khớp!!!')
      return res.redirect('/register')
    }

    try {
      const existingUser = await User.findOne({ email })

      if (existingUser) {
        req.flash('error', 'Email đã được sử dụng!!!')
        return res.redirect('/register')
      }
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = new User({
        name,
        email,
        password: hashedPassword,
      })

      await user.save()
      res.redirect('login')
    } catch (error) {
      req.flash('error', 'Đăng ký tài khoản thất bại!!!')
      return res.redirect('/register')
    }
  }

  login = async (req, res) => {
    const { email, password } = req.body

    if (email === '' || password === '') {
      req.flash('error', 'Chưa nhập email hoặc mật khẩu!!!')
      return res.redirect('/login')
    }

    try {
      const user = await User.findOne({ email })

      if (!user) {
        req.flash('error', 'Tài khoản không tồn tại!!!')
        return res.redirect('/login')
      }

      const isPasswordValid = await bcrypt.compare(password, user.password)

      if (!isPasswordValid) {
        req.flash('error', 'Sai mật khẩu!!!')
        return res.redirect('/login')
      }

      const token = jwt.sign({ id: user.id }, 'your_secret_key', {
        expiresIn: '1h',
      })
      req.session.userId = user.id
      req.session.userID = user._id
      req.session.userCode = user.user_code
      req.session.username = user.name
      req.session.fullName = user.fullName
      req.session.gender = user.gender
      req.session.birthDate = user.birthDate
      req.session.phone = user.phone
      req.session.email = user.email
      req.session.address = user.address
      req.session.token = token
      req.session.role = user.role
      if (user.role === 'admin') {
        res.redirect('/admin/order/list')
      } else {
        res.redirect('/')
      }
    } catch (error) {
      req.flash('error', 'Đăng nhập thất bại!!!')
      return res.redirect('/login')
    }
  }

  logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/')
      }

      res.clearCookie('connect.sid') // Clear the session cookie
      res.redirect('/login')
    })
  }

  show = async (req, res) => {
    try {
      const role = ['admin', 'user']
      const user = await User.findOne({ id: req.params.id }).lean()
      res.render('admin/user/edit', {
        user,
        role,
        showAdmin: true,
        messages: req.flash(),
      })
    } catch (error) {
      req.flash('error', 'Failed to load user.')
      res.redirect('/admin')
    }
  }

  update = async (req, res) => {
    const { id, phone, address, role, fullName, gender, birthDate } = req.body
    try {
      if (phone && !this.isPhoneNumber(phone)) {
        return res.json({
          success: false,
          message: 'Số điện thoại không hợp lệ.',
        })
      }

      // Validate gender
      if (gender && !['male', 'female', 'other', ''].includes(gender)) {
        return res.json({
          success: false,
          message: 'Giới tính không hợp lệ.',
        })
      }

      // Validate birthDate format (YYYY-MM-DD)
      if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
        return res.json({
          success: false,
          message: 'Ngày sinh không đúng định dạng.',
        })
      }

      const updateData = {}
      if (phone !== undefined) updateData.phone = phone
      if (address !== undefined) updateData.address = address
      if (fullName !== undefined) updateData.fullName = fullName
      if (gender !== undefined) updateData.gender = gender
      if (birthDate !== undefined) updateData.birthDate = birthDate
      if (role !== undefined) updateData.role = role

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      })

      if (role) {
        if (updatedUser) {
          res.redirect('/admin/user/list')
        } else {
          req.flash('error', 'Cập nhập thất bại!!!')
          const referer = req.get('Referer')
          res.redirect(referer)
        }
      } else {
        if (updatedUser) {
          req.session.phone = updatedUser.phone
          req.session.address = updatedUser.address
          req.session.fullName = updatedUser.fullName
          req.session.gender = updatedUser.gender
          req.session.birthDate = updatedUser.birthDate

          return res.json({
            success: true,
            message: 'Cập nhật thành công.',
          })
        } else {
          return res.json({
            success: false,
            message: 'Không tìm thấy người dùng.',
          })
        }
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return res.json({
        success: false,
        message: 'Có lỗi xảy ra khi cập nhật.',
      })
    }
  }

  isPhoneNumber(phone) {
    const phoneRegex = /^0[0-9]{9,10}$/
    return phoneRegex.test(phone)
  }

  changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const userId = req.session.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bạn chưa đăng nhập',
      })
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
      })
    }

    try {
      const user = await User.findOne({ id: userId })

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        })
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      )

      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng',
        })
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      // Update password
      user.password = hashedNewPassword
      await user.save()

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công',
      })
    } catch (error) {
      console.error('Error changing password:', error)
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi đổi mật khẩu',
      })
    }
  }

  rating = async (req, res) => {
    const { product_ids, order_id, rating, comment } = req.body
    const user_id = req.session.userId

    try {
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
            // Create new review
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
      // Tìm đơn hàng và kiểm tra quyền sở hữu
      const order = await Order.findOne({ id: orderId, user_id: userId })

      if (!order) {
        return res.status(404).json({
          success: false,
          message:
            'Không tìm thấy đơn hàng hoặc bạn không có quyền hủy đơn hàng này',
        })
      }

      // Kiểm tra trạng thái đơn hàng
      if (order.status !== 'Chờ xử lý') {
        return res.status(400).json({
          success: false,
          message: 'Chỉ có thể hủy đơn hàng có trạng thái "Chờ xử lý"',
        })
      }

      // Lấy danh sách sản phẩm trong đơn hàng để hoàn trả tồn kho
      const orderItems = await Order_Item.find({ order_id: orderId })

      // Hoàn trả tồn kho cho từng sản phẩm
      for (const item of orderItems) {
        const product = await Product.findOne({ id: item.product_id })
        if (product) {
          // Nếu có variant_type và sản phẩm có variants
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
            // Nếu không có variant, hoàn trả stock tổng
            await Product.findOneAndUpdate(
              { id: item.product_id },
              { $inc: { stock: item.quantity } },
            )
          }
        }
      }

      // Cập nhật trạng thái đơn hàng thành "Đã hủy"
      await Order.findOneAndUpdate(
        { id: orderId },
        {
          status: 'Đã hủy',
          updated_at: new Date(),
        },
      )

      res.json({
        success: true,
        message: 'Đã hủy đơn hàng thành công',
      })
    } catch (error) {
      console.error('Error canceling order:', error)
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra khi hủy đơn hàng',
      })
    }
  }

  showForgotPasswordForm = (req, res) => {
    res.render('forgot-password', { showLogin: true, messages: req.flash() })
  }

  handleForgotPassword = async (req, res) => {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      req.flash('error', 'Email không tồn tại!')
      return res.redirect('/forgot-password')
    }
    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + 3600000 // 1h
    await user.save()

    // Cấu hình gửi email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'thuylinh09052003@gmail.com',
        pass: 'kbgr tdwe yjgg fhny',
      },
    })

    const resetUrl = `http://${req.headers.host}/reset-password/${token}`
    await transporter.sendMail({
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      html: `<p>Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu.</p>
             <p>Nhấn vào link sau để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a></p>`,
    })
    req.flash('success', 'Đã gửi email đặt lại mật khẩu!')
    res.redirect('/forgot-password')
  }

  showResetPasswordForm = async (req, res) => {
    const { token } = req.params
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      req.flash('error', 'Token không hợp lệ hoặc đã hết hạn.')
      return res.redirect('/forgot-password')
    }
    res.render('reset-password', {
      showLogin: true,
      token,
      messages: req.flash(),
    })
  }

  handleResetPassword = async (req, res) => {
    const { token } = req.params
    const { password, confirmPassword } = req.body
    if (password.length < 6) {
      req.flash('error', 'Mật khẩu mới phải có ít nhất 6 ký tự')
      return res.render('reset-password', {
        showLogin: true,
        token,
        messages: req.flash(),
      })
    }
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp.')
      return res.render('reset-password', {
        showLogin: true,
        token,
        messages: req.flash(),
      })
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      req.flash('error', 'Token không hợp lệ hoặc đã hết hạn.')
      return res.redirect('/reset-password')
    }
    // Hash lại mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10)
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    return res.redirect('/login')
  }
}

module.exports = new UserController()
