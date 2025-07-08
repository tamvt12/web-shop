const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const User = new Schema({
  id: { type: Number, unique: true },
  name: { type: String },
  email: { type: String, unique: true },
  password: { type: String },
  fullName: { type: String },
  gender: { type: String },
  birthDate: { type: String },
  role: { type: String, default: 'user' },
  phone: { type: String, default: null, length: 10 },
  address: { type: String, default: null },
  user_code: { type: String, unique: true },
})

User.plugin(AutoIncrement, { inc_field: 'id', id: 'user_id_counter' })
User.post('save', async function (doc, next) {
  if (!doc.user_code && doc.id) {
    const code = 'KH' + String(doc.id).padStart(4, '0')
    await doc.constructor.findByIdAndUpdate(doc._id, { user_code: code })
  }
  next()
})

module.exports = mongoose.model('User', User)
