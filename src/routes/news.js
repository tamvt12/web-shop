const express = require('express')
const router = express.Router()
const { checkLoggedIn, checkAdmin } = require('../middleware/authMiddleware')
const NewsController = require('../app/controllers/NewsController')
const multer = require('multer')
const path = require('path')

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/news')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 10 * 1024 * 1024,
    fileSize: 5 * 1024 * 1024,
  },
})

// Admin routes
router.get('/list', checkLoggedIn, checkAdmin, NewsController.index)
router.get('/add', checkLoggedIn, checkAdmin, NewsController.create)
router.post('/add', NewsController.store)
router.get('/edit/:id', NewsController.edit)
router.post('/edit/:id', NewsController.update)
router.delete('/destroy/:id', checkLoggedIn, checkAdmin, NewsController.destroy)

module.exports = router
