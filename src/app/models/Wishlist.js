const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const wishlist = new mongoose.Schema({
  id: { type: Number, unique: true },
  user_id: { type: Number, required: true },
  product_id: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
})
wishlist.plugin(AutoIncrement, {
  inc_field: 'id',
  id: 'wishlist_id_counter',
})

module.exports = mongoose.model('Wishlist', wishlist)
