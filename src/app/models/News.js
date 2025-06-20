const mongoose = require('mongoose')
const Schema = mongoose.Schema

const newsSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
    // Content will store HTML from CKEditor
  },
  summary: {
    type: String,
    required: true,
    trim: true,
  },
  image_url: {
    type: String,
    // required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Update the updatedAt timestamp before saving
newsSchema.pre('save', function (next) {
  this.updatedAt = Date.now()
  next()
})

module.exports = mongoose.model('News', newsSchema)
