const moment = require('moment')

function formatCurrency(price) {
  console.log('🚀 ~ formatCurrency ~ price:', price)
  const priceNumber = parseFloat(price)

  if (isNaN(priceNumber)) {
    return 'Invalid Price'
  }

  return priceNumber.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + ' đ'
}

function ifCond(v1, v2, options) {
  if (v1 && v2 && v1.toString() === v2.toString()) {
    return options.fn(this)
  }
  return options.inverse(this)
}

function formatCount(count) {
  if (count > 99) {
    return '99+'
  }
  return count
}

function totalPrice(price, quantity) {
  return (parseFloat(price) * parseFloat(quantity)).toFixed(2)
}

function formatDate(date) {
  return moment(date).format('HH:mm:ss DD/MM/YYYY')
}

function ifEquals(arg1, arg2, options) {
  return arg1 == arg2 ? options.fn(this) : options.inverse(this)
}

function formatAverageRating(averageRating) {
  const maxStars = 5 // Total number of stars in the rating system
  const roundedRating = Math.round(averageRating) // Round the average rating to nearest integer
  let starIcons = ''

  // Append full star icons for the rounded rating
  for (let i = 0; i < roundedRating; i++) {
    starIcons += '★' // Full star icon
  }

  // Append empty star icons for the remaining stars
  for (let i = roundedRating; i < maxStars; i++) {
    starIcons += '☆' // Empty star icon
  }

  return starIcons
}

// Thêm các helper mới cho phân trang
function add(a, b) {
  return a + b
}

function subtract(a, b) {
  return a - b
}

function times(n, block) {
  let accum = ''
  for (let i = 0; i < n; ++i) {
    const data = { index: i + 1, ratingValue: 5 - i }
    accum += block.fn(this, { data: data })
  }
  return accum
}

function eq(a, b) {
  return a === b
}

function gt(a, b) {
  return a > b
}

function lt(a, b) {
  return a < b
}

// Helper tạo mảng từ các tham số truyền vào
function array() {
  // Loại bỏ đối tượng options ở cuối arguments
  return Array.prototype.slice.call(arguments, 0, -1)
}

module.exports = {
  formatCurrency,
  ifCond,
  formatCount,
  totalPrice,
  formatDate,
  ifEquals,
  formatAverageRating,
  add,
  subtract,
  times,
  eq,
  gt,
  lt,
  json: function (context) {
    return JSON.stringify(context, null, 2)
  },
  array,
}
