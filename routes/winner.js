// import external modules
const router = require('express').Router();

// import internal modules
const logger = require('../utils/logger');

// import models
const Member = require('../models/member');

// render winner page
router.get('/', async (req, res) => {
	try {
		if (req.session.result === undefined) {
			return res.redirect(301, '/ideal-type-world-cup/');
		}
		const { _id, results } = req.session.result;
		const member = await Member.findOne({ _id });
		res.render('winner', { member, results });
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
