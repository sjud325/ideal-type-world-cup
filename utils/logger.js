// import external modules
const path = require('path');
const moment = require('moment');
const winston = require('winston');

const timestamp = () => {
	return moment().format('YYYY-MM-DD HH:mm:ss.SSS');
};

const format = winston.format.printf(({ level, message }) => {
	return `${timestamp()} [${level}]: ${message}`;
});

// logger creation settings
module.exports = winston.createLogger({
	level: 'debug', // start level to show
	format: winston.format.combine(format),
	transports: [
		// show in console and save to files
		new winston.transports.Console(),
		new winston.transports.File({
			// all logs will be saved to logs/combined.log
			filename: path.join(process.cwd(), 'logs', 'combined.log')
		}),
		new winston.transports.File({
			// only error logs will be saved to logs/error.log
			filename: path.join(process.cwd(), 'logs', 'error.log'),
			level: 'error'
		})
	]
});
