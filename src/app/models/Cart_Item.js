const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Cart_Item = new Schema({
  id: { type: Number, unique: true },
  user_id: Schema.Types.ObjectId,
  product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
  quantity: Number,
})

Cart_Item.plugin(AutoIncrement, { inc_field: 'id', id: 'cart_item_id_counter' })

module.exports = mongoose.model('Cart_Item', Cart_Item)
