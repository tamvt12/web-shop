const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Review = new Schema({
	user_id: Schema.Types.ObjectId,
	product_id: Schema.Types.ObjectId,
	rating: Number,
	comment: String,
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Review', Review);
