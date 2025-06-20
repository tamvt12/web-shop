const mongoose = require('mongoose')

const url = process.env.MONGO_URI

async function connect() {
  try {
    if (!url) {
      console.error('MongoDB URI is not defined in environment variables')
      throw new Error('MongoDB URI is not defined')
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }

    await mongoose.connect(url, options)
    console.log('MongoDB connected successfully!')
  } catch (error) {
    console.error('MongoDB connection error:', error.message)
    throw error
  }
}

const getConnectionString = () => {
  if (!url) {
    throw new Error('MongoDB URI is not defined')
  }
  return url
}

module.exports = { connect, getConnectionString }
