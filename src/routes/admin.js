const express = require('express');
const router = express.Router();
const AdminController = require('../app/controllers/AdminController');

router.get('/order/list', AdminController.showOrder);
router.get('/order/edit/:id', AdminController.editOrder);
router.post('/order/edit/:id', AdminController.updateOrder);
router.get('/cart-item/list', AdminController.showCartItem);
router.get('/order-item/list', AdminController.showOrderItem);
router.get('/review/list', AdminController.showReview);

module.exports = router;
