const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Order = new Schema({
  id: { type: Number, unique: true },
  user_id: Number,
  total: mongoose.Types.Decimal128,
  status: { type: String, length: 50, default: 'Chờ xử lý' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  receiver_name: { type: String, length: 50 },
  receiver_phone: { type: String, length: 15 },
  receiver_address: { type: String, length: 255 },
  shipping_method: { type: String, length: 50 },
  payment_method: { type: String, length: 50 },
  order_code: { type: String, unique: true },
})

Order.plugin(AutoIncrement, { inc_field: 'id', id: 'order_id_counter' })

// Gán mã đơn hàng tự động sau khi đã có id
Order.post('save', async function (doc, next) {
  if (!doc.order_code && doc.id) {
    const code = 'MD' + String(doc.id).padStart(4, '0')
    await doc.constructor.findByIdAndUpdate(doc._id, { order_code: code })
  }
  next()
})

module.exports = mongoose.model('Order', Order)
