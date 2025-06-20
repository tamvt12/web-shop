const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Order = new Schema({
	user_id: Schema.Types.ObjectId,
	total: mongoose.Types.Decimal128,
	status: { type: String, length: 50, default: 'Chờ xử lý' },
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', Order);
