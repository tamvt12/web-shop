const moment = require('moment')

function formatCurrency(price) {
  const priceNumber = parseFloat(price)

  if (isNaN(priceNumber)) {
    return 'Invalid Price'
  }

  return priceNumber.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + ' đ'
}
function lookupVariantPrice(variants, type) {
  if (!variants || !type) return 0
  const found = variants.find((v) => v.type === type)
  if (!found) return 0
  // Nếu dùng Decimal128 của MongoDB
  if (typeof found.price === 'object' && found.price.$numberDecimal) {
    return parseFloat(found.price.$numberDecimal)
  }
  return found.price
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

function multiply(a, b) {
  return parseFloat(a) * parseFloat(b)
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

function length(array) {
  if (Array.isArray(array)) {
    return array.length
  }
  return 0
}

function range(start, end, options) {
  let result = ''
  for (let i = start; i <= end; i++) {
    result += options.fn(i)
  }
  return result
}

module.exports = {
  formatCurrency,
  ifCond,
  formatCount,
  totalPrice,
  formatDate,
  ifEquals,
  formatAverageRating,
  lookupVariantPrice,
  multiply,
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
  length,
	range,
}
