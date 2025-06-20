const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Cart_Item = new Schema({
	user_id: Schema.Types.ObjectId,
	product_id: { type: Schema.Types.ObjectId, ref: 'Product' },
	quantity: Number,
});

module.exports = mongoose.model('Cart_Item', Cart_Item);
