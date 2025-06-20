const express = require('express');
const router = express.Router();
const productController = require('../app/controllers/ProductController');
const { upload } = require('../config/upload');

router.get('/add', productController.create);
router.post('/add', productController.store);
router.get('/list', productController.index);
router.get('/edit/:id', productController.show);
router.post('/edit/:id', productController.update);
router.delete('/destroy/:id', productController.destroy);
router.post('/upload-image', (req, res, next) => {
	upload.single('image')(req, res, function (err) {
		if (err) {
			res.status(400).json({
				success: false,
				message: err.message,
			});
			return;
		}
		productController.upload(req, res, next);
	});
});

module.exports = router;
