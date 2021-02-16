const mongoose = require('mongoose');

const schema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true
		},
		gender: {
			type: String,
			required: true
		},
		likes: {
			type: Number,
			default: 0
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

module.exports = mongoose.model('Member', schema, 'member');
