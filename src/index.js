require('dotenv').config()
const express = require('express')
const engine = require('express-handlebars')
const morgan = require('morgan')
const path = require('path')
const multer = require('multer')
const app = express()
const port = process.env.PORT
const route = require('./routes')
const db = require('./config/db')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const flash = require('connect-flash')
const sessionUserMiddleware = require('./middleware/sessionUser')
const helpers = require('./helpers/helpers')

db.connect()

// HTTP logger
app.use(morgan('combined'))

const hbs = engine.create({
  helpers: {
    ifCond: helpers.ifCond,
    formatCurrency: helpers.formatCurrency,
    formatCount: helpers.formatCount,
    totalPrice: helpers.totalPrice,
    formatDate: helpers.formatDate,
    ifEquals: helpers.ifEquals,
    formatAverageRating: helpers.formatAverageRating,
    lookupVariantPrice: helpers.lookupVariantPrice,
    multiply: helpers.multiply,
    add: helpers.add,
    subtract: helpers.subtract,
    times: helpers.times,
    eq: helpers.eq,
    gt: helpers.gt,
    lt: helpers.lt,
    array: helpers.array,
    json: function (context) {
      return JSON.stringify(context, null, 2)
    },
    length: helpers.length,
  },
  extname: '.hbs',
})

// Template engine
app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'resources', 'views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(
  express.urlencoded({
    extended: true,
    limit: '50mb',
  }),
)
app.use(express.json({ limit: '50mb' }))

const mongoUrl = db.getConnectionString()

// Cấu hình express-session
app.use(
  session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: mongoUrl,
      collectionName: 'sessions',
    }),
  }),
)

app.use(flash())
app.use(sessionUserMiddleware)

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: 'Lỗi khi upload file: ' + err.message,
    })
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi Server nội bộ',
  })
})

route(app)
app.use('*', (req, res) => {
  res.status(404).render('404')
})

app.listen(port, () => console.log(`App listening at http://localhost:${port}`))
