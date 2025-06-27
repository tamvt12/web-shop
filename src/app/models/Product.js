const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Product = new Schema({
  id: { type: Number, unique: true },
  name: String,
  description: String,
  category_id: Number,
  image_url: String,
  variants: [
    {
      type: { type: String, required: true },
      price: { type: mongoose.Types.Decimal128, required: true },
      stock: { type: Number, default: 0 },
    },
  ],
})

Product.plugin(AutoIncrement, { inc_field: 'id', id: 'product_id_counter' })

module.exports = mongoose.model('Product', Product)
