const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Order = new Schema({
  id: { type: Number, unique: true },
  user_id: Schema.Types.ObjectId,
  total: mongoose.Types.Decimal128,
  status: { type: String, length: 50, default: 'Chờ xử lý' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

Order.plugin(AutoIncrement, { inc_field: 'id', id: 'order_id_counter' })

module.exports = mongoose.model('Order', Order)
