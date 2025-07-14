const Review = require('../models/Review')
const Users = require('../models/User')

function getFirstImage(image_url) {
  if (typeof image_url === 'string') {
    const arr = image_url
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean)
    return arr.length > 0 ? arr[0] : ''
  }
  return image_url
}

async function getProductRating(productId) {
  const ratingData = await Review.aggregate([
    { $match: { product_id: productId } },
    {
      $group: {
        _id: '$product_id',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ])
  return {
    rating: ratingData.length > 0 ? ratingData[0].averageRating : 0,
    reviewCount: ratingData.length > 0 ? ratingData[0].reviewCount : 0,
  }
}

async function getUserNameById(userId) {
  const user = await Users.findOne({ id: userId }, { name: 1, _id: 0 }).lean()
  return user ? user.name : ''
}

module.exports = {
  getFirstImage,
  getProductRating,
  getUserNameById,
}
