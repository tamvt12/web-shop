const express = require('express');
const router = express.Router();
const categoryController = require('../app/controllers/CategoryController');

router.get('/add', categoryController.create);
router.post('/add', categoryController.store);
router.get('/list', categoryController.index);
router.get('/edit/:id', categoryController.show);
router.post('/edit/:id', categoryController.update);
router.delete('/destroy/:id', categoryController.destroy);
router.get('/count', categoryController.count);

module.exports = router;
