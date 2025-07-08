const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Wishlist = require('../models/Wishlist')
const Product = require('../models/Product')

class UserController {
  async index(req, res) {
    try {
      const users = await User.find({})
      res.json(users)
    } catch (error) {
      res.status(400).json({ err: 'ERROR!!!' })
    }
  }

  showLogin(req, res) {
    res.render('login', { showLogin: true, messages: req.flash() })
  }

  showRegister(req, res) {
    res.render('register', { showLogin: true, messages: req.flash() })
  }

  async register(req, res) {
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

  async login(req, res) {
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
      req.session.sessionUserCode = user.user_code
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

  update = async (req, res) => {
    const { id, phone, address, fullName, gender, birthDate } = req.body

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

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      })

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

  async changePassword(req, res) {
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

  async addWishlist(req, res) {
    try {
      const userId = req.session.userId
      const productId = req.params.productId
      const exists = await Wishlist.findOne({
        user_id: userId,
        product_id: productId,
      })
      if (exists) {
        return res.status(400).json({ message: 'Đã có trong yêu thích' })
      }
      await Wishlist.create({ user_id: userId, product_id: productId })
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  async removeWishlist(req, res) {
    try {
      const userId = req.session.userId
      const productId = req.params.productId
      await Wishlist.deleteOne({ user_id: userId, product_id: productId })
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }

  async checkWishlist(req, res) {
    try {
      const userId = req.session.userId
      const productId = req.params.productId
      const exists = await Wishlist.findOne({
        user_id: userId,
        product_id: productId,
      })
      res.json({ favorited: !!exists })
    } catch (err) {
      res.status(500).json({ message: 'Lỗi server' })
    }
  }
}

module.exports = new UserController()
