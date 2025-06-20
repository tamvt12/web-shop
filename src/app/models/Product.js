const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Product = new Schema({
	name: String,
	description: String,
	price: mongoose.Types.Decimal128,
	stock: Number,
	category_id: Schema.Types.ObjectId,
	image_url: String,
});

module.exports = mongoose.model('Product', Product);
