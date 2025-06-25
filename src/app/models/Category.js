const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const Category = new Schema({
  id: { type: Number, unique: true },
  name: String,
  image_url: String,
})

Category.plugin(AutoIncrement, { inc_field: 'id', id: 'category_id_counter' })

module.exports = mongoose.model('Category', Category)
