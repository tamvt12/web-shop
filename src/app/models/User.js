const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = new Schema({
	name: { type: String },
	email: { type: String, unique: true },
	password: { type: String },
	role: { type: String, default: 'user' },
	phone: { type: String, default: null, length: 10 },
	address: { type: String, default: null },
});

module.exports = mongoose.model('User', User);
