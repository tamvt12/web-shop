const express = require('express')
const router = express.Router()
const productController = require('../app/controllers/ProductController')
const { upload } = require('../config/upload')

router.get('/add', productController.create)
router.post('/add', productController.store)
router.get('/list', productController.index)
router.get('/edit/:id', productController.show)
router.post('/edit/:id', productController.update)
router.delete('/destroy/:id', productController.destroy)

// Product image upload endpoint
router.post('/upload-image', (req, res, next) => {
  upload.array('images', 10)(req, res, function (err) {
    if (err) {
      res.status(400).json({
        success: false,
        message: err.message,
      })
      return
    }
    // Use the same upload logic as admin
    const AdminController = require('../app/controllers/AdminController')
    AdminController.upload(req, res, next)
  })
})

module.exports = router
