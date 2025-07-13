const mongoose = require('mongoose')
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Favorite = new mongoose.Schema({
  id: { type: Number, unique: true },
  user_id: { type: Number, required: true },
  product_id: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
})
Favorite.plugin(AutoIncrement, {
  inc_field: 'id',
  id: 'favorite_id_counter',
})

module.exports = mongoose.model('Favorite', Favorite)
