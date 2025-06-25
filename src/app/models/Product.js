const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Product = new Schema({
  id: { type: Number, unique: true },
  name: String,
  description: String,
  price: mongoose.Types.Decimal128,
  stock: Number,
  category_id: Schema.Types.ObjectId,
  image_url: String,
})

Product.plugin(AutoIncrement, { inc_field: 'id', id: 'product_id_counter' })

module.exports = mongoose.model('Product', Product)
