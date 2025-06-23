const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Category = new Schema({
  name: String,
  image_url: String,
})

module.exports = mongoose.model('Category', Category)
