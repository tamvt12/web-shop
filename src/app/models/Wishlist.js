const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  product_id: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})
module.exports = mongoose.model('Wishlist', wishlistSchema)
