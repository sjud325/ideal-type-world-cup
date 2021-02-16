// import external modules
const router = require('express').Router();

// import internal modules
const logger = require('../utils/logger');

// import models
const Member = require('../models/member');

// render member page
router.get('/', async (req, res) => {
	let { gender } = req.query;
	if (gender === undefined || (gender !== 'male' && gender !== 'female')) {
		gender = 'female'; // set female as default
	}
	try {
		const results = await Member.find({ gender });
		res.render('member', { gender, results });
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

// get count of members
router.get('/count', async (req, res) => {
	const { gender } = req.query;
	try {
		const count = await Member.countDocuments({ gender });
		res.status(200).json({ count });
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

// create a member
router.post('/', async (req, res) => {
	const { name, gender } = req.body;
	try {
		if (name.split(' ').length > 2) {
			return res.status(400).json({ message: 'too much space' });
		}
		const results = await new Member({ name, gender }).save();
		const all = await Member.find({ gender });
		res.status(201).json({ results, all });
	} catch (error) {
		if (error.code && error.code === 11000) {
			return res.status(403).json({ message: 'already exists' });
		}
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

// delete a member
router.delete('/', async (req, res) => {
	const { _id, gender } = req.body;
	try {
		await Member.deleteOne({ _id });
		const all = await Member.find({ gender });
		res.status(200).send({ all });
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
