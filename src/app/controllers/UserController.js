const UserService = require('../services/UserService')
const crypto = require('crypto')
const nodemailer = require('nodemailer')

class UserController {
  index = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1
    const perPage = 15
		const search = req.query.search ? req.query.search.trim() : ''
    try {
      const {
        users,
        currentPage,
        totalPages,
        pages,
      } = await UserService.getUsersPaginated(page, perPage, search)
      res.render('admin/user/list', {
        showAdmin: true,
        users,
        currentPage,
        totalPages,
        pages,
				search,
      })
    } catch (error) {
      next(error)
    }
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
      await UserService.registerUser({ name, email, password })
      res.redirect('login')
    } catch (error) {
      req.flash('error', error.message || 'Đăng ký tài khoản thất bại!!!')
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
      const { user, token } = await UserService.loginUser({ email, password })
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
        res.redirect('/admin/dashboard')
      } else {
        res.redirect('/')
      }
    } catch (error) {
      req.flash('error', error.message || 'Đăng nhập thất bại!!!')
      return res.redirect('/login')
    }
  }

  logout = (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/')
      }
      res.clearCookie('connect.sid')
      res.redirect('/login')
    })
  }

  show = async (req, res) => {
    try {
      const role = ['admin', 'user']
      const user = await UserService.getUserById(req.params.id)
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
      if (phone && !UserService.isPhoneNumber(phone)) {
        return res.json({
          success: false,
          message: 'Số điện thoại không hợp lệ.',
        })
      }
      if (gender && !UserService.isValidGender(gender)) {
        return res.json({
          success: false,
          message: 'Giới tính không hợp lệ.',
        })
      }
      if (birthDate && !UserService.isValidBirthDate(birthDate)) {
        return res.json({
          success: false,
          message: 'Ngày sinh không đúng định dạng.',
        })
      }
      const updatedUser = await UserService.updateUser({
        id,
        phone,
        address,
        role,
        fullName,
        gender,
        birthDate,
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
      await UserService.changePassword({ userId, currentPassword, newPassword })
      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công',
      })
    } catch (error) {
      console.error('Error changing password:', error)
      return res.status(400).json({
        success: false,
        message: error.message || 'Có lỗi xảy ra khi đổi mật khẩu',
      })
    }
  }

  showForgotPasswordForm = (req, res) => {
    res.render('forgot-password', { showLogin: true, messages: req.flash() })
  }

  handleForgotPassword = async (req, res) => {
    const { email } = req.body
    const user = await UserService.getUserByEmail(email)
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
        user: 'vutrongtam1999@gmail.com',
        pass: 'jyrd meij amrt wwcg',
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
    const user = await UserService.getUserByResetPasswordToken(token)
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
    const user = await UserService.getUserByResetPasswordToken(token)
    if (!user) {
      req.flash('error', 'Token không hợp lệ hoặc đã hết hạn.')
      return res.redirect('/reset-password')
    }
    // Hash lại mật khẩu
    const hashedPassword = await UserService.hashPassword(password)
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    return res.redirect('/login')
  }
}

module.exports = new UserController()
