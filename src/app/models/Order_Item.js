const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Order_Item = new Schema({
  id: { type: Number, unique: true },
  order_id: { type: Number, ref: 'Order' },
  product_id: { type: Number, ref: 'Product' },
  quantity: Number,
  price: mongoose.Types.Decimal128,
  variant_type: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

Order_Item.plugin(AutoIncrement, {
  inc_field: 'id',
  id: 'order_item_id_counter',
})

module.exports = mongoose.model('Order_Item', Order_Item)
