const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const AdminService = require('./AdminService')

class UserService {
  getUsersPaginated = async (page = 1, perPage = 15) => {
    const totalUsers = await User.countDocuments({})
    const { totalPages, pages, skip } = AdminService.getPagination(
      totalUsers,
      page,
      perPage,
    )
    const users = await User.find({}).skip(skip).limit(perPage).lean()
    return { users, currentPage: page, totalPages, pages }
  }

  registerUser = async ({ name, email, password }) => {
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new Error('Email đã được sử dụng!!!')
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hashedPassword })
    await user.save()
    return user
  }

  loginUser = async ({ email, password }) => {
    const user = await User.findOne({ email })
    if (!user) {
      throw new Error('Tài khoản không tồn tại!!!')
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Sai mật khẩu!!!')
    }
    const token = jwt.sign({ id: user.id }, 'your_secret_key', {
      expiresIn: '1h',
    })
    return { user, token }
  }

  getUserById = async (id) => {
    return await User.findOne({ id }).lean()
  }

  updateUser = async ({
    id,
    phone,
    address,
    role,
    fullName,
    gender,
    birthDate,
  }) => {
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
    return updatedUser
  }

  isPhoneNumber = (phone) => {
    const phoneRegex = /^0[0-9]{9,10}$/
    return phoneRegex.test(phone)
  }

  isValidGender = (gender) => {
    return ['male', 'female', 'other', ''].includes(gender)
  }

  isValidBirthDate(birthDate) {
    return /^\d{4}-\d{2}-\d{2}$/.test(birthDate)
  }

  changePassword = async ({ userId, currentPassword, newPassword }) => {
    const user = await User.findOne({ id: userId })
    if (!user) {
      throw new Error('Không tìm thấy người dùng')
    }
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    )
    if (!isCurrentPasswordValid) {
      throw new Error('Mật khẩu hiện tại không đúng')
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedNewPassword
    await user.save()
    return true
  }

  getUserByEmail = async (email) => {
    return await User.findOne({ email })
  }

  // Tìm user theo token reset password còn hạn
  getUserByResetPasswordToken = async (token) => {
    return await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })
  }

  // Hash mật khẩu mới
  hashPassword = async (password) => {
    return await bcrypt.hash(password, 10)
  }
}

module.exports = new UserService()
