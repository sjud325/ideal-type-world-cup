const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: {
		index: ['webpack-hot-middleware/client?path=/ideal-type-world-cup/__what', './public/js/index.js'],
		choice: ['webpack-hot-middleware/client?path=/ideal-type-world-cup/__what', './public/js/choice.js'],
		winner: ['webpack-hot-middleware/client?path=/ideal-type-world-cup/__what', './public/js/winner.js'],
		member: ['webpack-hot-middleware/client?path=/ideal-type-world-cup/__what', './public/js/member.js']
	},
	output: {
		path: path.join(process.cwd(), 'dist'),
		publicPath: '', // prefix path used in browser
		filename: 'js/[name].js' // index.js, choice.js, winner.js, member.js
	},
	mode: 'development',
	target: 'web', // this is default target of webpack
	devtool: 'source-map', // this makes debugging in bundled js
	performance: {
		maxAssetSize: 256000
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			},
			{
				test: /\.scss$/,
				use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
			},
			{
				test: /\.(png|svg|jpg|gif|woff|woff2)$/,
				loader: 'file-loader',
				options: {
					name: '[folder]/[name].[ext]',
					publicPath: '..'
				}
			}
		]
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: 'css/[name].css' // index.css, choice.css, winner.css, member.css
		}),
		new webpack.HotModuleReplacementPlugin(),
		new webpack.NoEmitOnErrorsPlugin()
	]
};
