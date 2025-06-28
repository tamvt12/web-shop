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
})

User.plugin(AutoIncrement, { inc_field: 'id', id: 'user_id_counter' })

module.exports = mongoose.model('User', User)
