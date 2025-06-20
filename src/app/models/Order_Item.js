const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Order_Item = new Schema({
	order_id: { type: Schema.Types.ObjectId, ref: 'Order' },
	product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
	quantity: Number,
	price: mongoose.Types.Decimal128,
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order_Item', Order_Item);
