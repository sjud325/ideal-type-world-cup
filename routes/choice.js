// import external modules
const axios = require('axios');
const router = require('express').Router();
const cheerio = require('cheerio');

// import internal modules
const logger = require('../utils/logger');

// import models
const Member = require('../models/member');

// render choice page
router.get('/', async (req, res) => {
	let { gender, round } = req.query;
	if (gender === undefined || (gender !== 'male' && gender !== 'female')) {
		gender = 'female'; // set female as default
	}
	if (round === undefined || (round !== '16' && round !== '32' && round !== '64')) {
		round = 16; // set 16 rounds as default
	} else {
		round = Number(round);
	}
	try {
		// if the user come to here first time or the gender is changed
		if (req.session.object === undefined || req.session.object.gender !== gender) {
			// get all members in db
			const members = await Member.find({ gender });
			// if there are not enough members, redirect to main page
			if (members.length < round) {
				return res.redirect(301, '/ideal-type-world-cup/');
			}
			// get random members without overlap
			const selected = [];
			while (selected.length < round) {
				const random = Math.floor(Math.random() * members.length);
				selected.push(members[random]);
				members.splice(random, 1);
			}
			// initialize session data
			req.session.object = {
				round: { total: round, completed: 0 },
				members: { current: [], remain: selected },
				results: [],
				gender
			};
		}
		res.render('choice');
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

// get two members photo
router.get('/match', async (req, res) => {
	try {
		if (req.session.object === undefined) {
			return res.status(403).json({ message: 'empty session' });
		}
		const {
			round,
			members: { current, remain }
		} = req.session.object;
		// if the user has no member to choose
		if (current.length === 0) {
			// get two members randomly without overlap
			while (current.length < 2) {
				const random = Math.floor(Math.random() * remain.length);
				current.push(remain[random]);
				remain.splice(random, 1);
			}
		}
		const json = [];
		for (const cur of current) {
			// get the results of google image search
			const query = `${cur.name} 고화질`;
			const url = [
				`https://www.google.co.kr/search`,
				`?q=${encodeURI(query)}`, // query
				`&tbm=isch`, // google image search
				`&tbs=isz%3Al`, // size option: large
				`&biw=1920`, // current browser width
				`&bih=935`, // current browser height
				`&hl=ko` // results in korean language
			];
			// this is necessary to get valid results
			const agent = [
				'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
				'AppleWebKit/537.36 (KHTML, like Gecko)',
				'Chrome/85.0.4183.83',
				'Safari/537.36'
			];
			const config = {
				url: url.join(''),
				method: 'get',
				headers: { 'User-Agent': agent.join(' ') }
			};
			const html = (await axios(config)).data;
			// cannot crawl in html section, so crawl in javascript section
			const sttToFind = `AF_initDataCallback({key: 'ds:1', isError:  false , hash: '2', data:`;
			const endToFind = `, sideChannel: {}});</script>`;
			const sttIndex = html.lastIndexOf(sttToFind) + sttToFind.length;
			const endIndex = html.indexOf(endToFind, sttIndex);
			const imgList = JSON.parse(html.substring(sttIndex, endIndex))[31][0][12][2];
			// image filtering
			const images = [];
			for (const img of imgList) {
				// if there is no image data, skip this
				if (img[1] === null) {
					continue;
				}
				const src = img[1][3][0];
				const width = img[1][3][2];
				const height = img[1][3][1];
				// if the image is too small, skip this
				if (width < 800 || height < 800) {
					continue;
				}
				// this sites don't show the image in other origin
				if (src.includes('mania.kr')) continue;
				if (src.includes('zmdzmd.net')) continue;
				if (src.includes('gasengi.com')) continue;
				if (src.includes('dvdprime.com')) continue;
				// if (src.includes('s2.gifyu.com')) continue;
				if (src.includes('idolworld.co.kr')) continue;
				if (src.includes('cdn.ppomppu.co.kr')) continue;
				// if (src.includes('serieamania.com')) continue;
				if (src.includes('down.humoruniv.com')) continue;
				// if (src.includes('down.humoruniv.org')) continue;
				// if (src.includes('thimg.todayhumor.co.kr')) continue;
				// add the image address
				images.push(src);
			}
			json.push({
				_id: cur._id,
				name: cur.name,
				images
			});
		}
		let spare = round.total - round.completed;
		switch (spare) {
			case 2:
				spare = '결승';
				break;
			case 4:
				spare = '준결승';
				break;
			case 8:
				spare = '8강';
				break;
			case 16:
				spare = '16강';
				break;
			case 32:
				spare = '32강';
				break;
			case 64:
				spare = '64강';
				break;
		}
		res.status(200).json({ round: spare, results: json });
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

router.post('/match', async (req, res) => {
	const { _id } = req.body;
	try {
		const {
			round,
			members: { current, remain },
			results
		} = req.session.object;
		// save the result
		if (current[0]._id === _id) {
			results.push({ winner: current[0], loser: current[1] });
		} else {
			results.push({ winner: current[1], loser: current[0] });
		}
		// clear the previous members
		current.splice(0, 2);
		// if there are enough members to choose, notify "continue" the game
		if (remain.length > 0) {
			return res.status(200).json({ game: 'continue' });
		}
		// if the user complete last round, notify the game is "end"
		if (round.total - results.length === 1) {
			await Member.updateOne({ _id }, { $inc: { likes: 1 } });
			req.session.result = { _id, results };
			req.session.object = undefined;
			return res.status(200).json({ game: 'end' });
		}
		// otherwise, renew the remain members using winners
		for (let i = round.completed; i < results.length; i++) {
			remain.push(results[i].winner);
		}
		// save the completed round number and notify "continue" the game
		round.completed = results.length;
		res.status(200).json({ game: 'continue' });
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

router.delete('/match', async (req, res) => {
	try {
		req.session.object = undefined;
		res.status(204).send();
	} catch (error) {
		logger.error(error.message);
		res.status(500).json({ message: error.message });
	}
});

module.exports = router;
