'use strict';

const puppeteer = require('puppeteer');

/**
 * Log if DEBUG flag was passed
 * @param {Boolean} DEBUG
 * @param {string} msg
 */
const logger = (DEBUG, message) =>
	DEBUG ? console.info(message) : null;


const pupperender = async (url, timeout) => {
	const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
	const page = await browser.newPage();
	await page.goto(url, {waitUntil: 'networkidle0'});
	await page.waitForTimeout(timeout);
	const content = await page.content();
	await browser.close();
	return content;
};

const cache = {};

module.exports.makeMiddleware = options => {
	const DEBUG = options.debug;
	const timeout = options.timeout || 5000; // ms
	const useCache = Boolean(options.useCache);
	const cacheTTL = (options.cacheTTL || 3600) * 1000; // ms
	const aadsIPs = ['5.9.113.137', '46.4.61.205', '213.239.217.45', '88.198.43.49'];

	return function (request, response, next) {
		logger(DEBUG, `[pupperender middleware] USER AGENT: ${request.headers['user-agent']}`);
		if (!aadsIPs.includes(request.ip)) return next();

		const incomingUrl = request.protocol + '://' + request.get('host') + request.originalUrl;
		logger(DEBUG, `[pupperender middleware] puppeterize url: ${incomingUrl}`);
		if (useCache && cache[incomingUrl] &&
					Date.now() <= cache[incomingUrl].expiresAt) {
			logger(DEBUG, `[pupperender middleware] Cache hit for ${incomingUrl}.`);
			response.set('Pupperender', 'true');
			response.set('Expires', new Date(cache[incomingUrl].expiresAt).toUTCString());
			response.send(cache[incomingUrl].data);
			return;
		}

		pupperender(incomingUrl, timeout)
			.then(content => { // eslint-disable-line promise/prefer-await-to-then
				cache[incomingUrl] = {
					expiresAt: Date.now() + cacheTTL,
					data: content
				};
				logger(DEBUG, `[pupperender middleware] Cache warmed for ${incomingUrl}.`);
				response.set('Pupperender', 'true');
				response.send(content);
			})
			.catch(error => {
				console.error(
					`[pupperender middleware] error fetching ${incomingUrl}`,
					error
				);
				return next();
			});
	};
};