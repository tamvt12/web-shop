const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Review = new Schema({
  id: { type: Number, unique: true },
  user_id: Number,
  product_id: Number,
  order_id: Number,
  rating: Number,
  comment: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

Review.plugin(AutoIncrement, { inc_field: 'id', id: 'review_id_counter' })

module.exports = mongoose.model('Review', Review)
