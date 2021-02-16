// import external modules
const ejs = require('ejs');
const path = require('path');
const redis = require('redis');
const dotenv = require('dotenv');
const morgan = require('morgan');
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const connectRedis = require('connect-redis');
const cookieParser = require('cookie-parser');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

// import internal modules
const logger = require('./utils/logger');

// import webpack configuration
const config = require('./webpack.config');

// load .config file to process.env
dotenv.config({ path: path.join(process.cwd(), '.config') });

// mongodb connection
mongoose.Promise = global.Promise;
const mongooseConnect = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true
		});
		logger.info('mongoose is connected to mongodb successfully.');
	} catch (error) {
		logger.error(error.message);
		process.exit(1); // abnormal exit
	}
};
mongoose.connection.on('error', (error) => {
	logger.error(error.message);
});
mongoose.connection.on('disconnected', () => {
	logger.info('mongoose is disconnected so need to reconnect.');
	mongooseConnect(); // reconnection after disconnection
});
mongooseConnect(); // first connection

// redis connection
const redisStore = connectRedis(session);
const redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

// web framework settings
const app = express();
const compiler = webpack(config);
app.use(webpackDevMiddleware(compiler)); // for file monitoring
app.use(webpackHotMiddleware(compiler, { path: '/__what' })); // for browser refresh
app.use(morgan('dev')); // the additional logging module for 'express' (preset: combined, common, dev, short, tiny)
app.use(express.static(config.output.path)); // if the file is found, 'next()' will not be invoked
app.use(express.json()); // 'express' support this middleware instead of 'body-parser'
app.use(express.urlencoded({ extended: false })); // 'true' means use npm 'qs' module
app.use(cookieParser(process.env.COOKIE_SECRET)); // signature for security of cookie
app.use(
	session({
		name: 'session-cookie', // the name of cookie in browser
		resave: false, // 'true' means save session again even no changes
		rolling: true, // 'true' means refresh expiration on every responses
		saveUninitialized: false, // 'true' means save session even no data
		secret: process.env.COOKIE_SECRET, // should be same as 'cookieParser' secret
		cookie: {
			maxAge: 1 * 24 * 60 * 60 * 1000, // left expired time (1 day)
			httpOnly: true, // 'true' means client cannot control this cookie
			secure: false // 'true' means only https can use this cookie
		},
		store: new redisStore({ client: redisClient }) // the store to save sessions info
	})
);
app.engine('html', ejs.renderFile); // render html files using ejs engine
app.set('views', path.join(process.cwd(), 'views')); // set template path
app.set('view engine', 'ejs'); // set template engine

// render index page
app.get('/', (req, res) => res.render('index'));

// load other endpoints
app.use('/choice', require('./routes/choice'));
app.use('/member', require('./routes/member'));
app.use('/winner', require('./routes/winner'));

// start web framework
app.listen(Number(process.env.PORT), () => {
	logger.info('web framework is started successfully.');
});
