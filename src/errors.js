'use strict';

const _ = require('lodash');
const util = require('util');
const errs = require('errs');

exports.modelNotFound = function (model, where) {
	model = model && (model.modelName || model);
	where = typeof where === 'string' ? {id: where} : where;
	return errs.create({
		code: 'MODEL_NOT_FOUND',
		status: 404,
		statusCode: 404,
		message: `Unknown "${model}" for ${util.inspect(where)}.`
	});
};

exports.badRequest = function (message) {
	return errs.create({
		code: 'BAD_REQUEST',
		status: 400,
		statusCode: 400,
		message: message || 'Bad Request',
	});
};

exports.unauthorized = function (message) {
	return errs.create({
		code: 'UNAUTHORIZED',
		status: 401,
		statusCode: 401,
		message: message || 'Unauthorized',
	});
};

exports.forbidden = function (message) {
	return errs.create({
		code: 'FORBIDDEN',
		status: 403,
		statusCode: 403,
		message: message || 'Forbidden',
	});
};

exports.notFound = function (message) {
	return errs.create({
		code: 'NOT_FOUND',
		status: 404,
		statusCode: 404,
		message: message || 'Not Found',
	});
};

exports.serverError = function (message) {
	return errs.create({
		code: 'INTERNAL_SERVER_ERROR',
		status: 500,
		statusCode: 500,
		message: message || 'Internal Server Error',
	});
};

exports.error = function () {
	const args = _.slice(arguments);
	let message = 'Internal Server Error';
	let status = 500;
	let props = {};
	args.forEach(arg => {
		if (!message && _.isString(arg)) {
			message = arg;
		} else if (!status && _.isNumber(arg)) {
			status = arg;
		} else if (_.isObject(arg)) {
			props = arg;
		}
	});

	return errs.create(Object.assign({message, status, statusCode: status}, props));
};
