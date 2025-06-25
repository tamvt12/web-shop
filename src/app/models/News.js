const mongoose = require('mongoose')
const Schema = mongoose.Schema
const AutoIncrement = require('mongoose-sequence')(mongoose)

const newsSchema = new Schema({
  id: { type: Number, unique: true },
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
  views: {
    type: Number,
    default: 0,
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

newsSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'news_id_counter' })

module.exports = mongoose.model('News', newsSchema)
