const assert = require('assert');
const Promise = require('bluebird');
const _ = require('lodash');
const minimatch = require('minimatch');

let debug = noop;

try {
	debug = require('debug')('loopback-utils');
} catch (e) {
	// no-op
}

const REL_METHODS = [
	'findById',
	'destroyById',
	'updateById',
	'exists',
	'link',
	'get',
	'create',
	'update',
	'destroy',
	'unlink',
	'count',
	'delete'
];

function noop() {
	// no-op
}

function createPromiseCallback() {
	let cb;
	const promise = new Promise((resolve, reject) => {
		cb = function (err, data) {
			if (err) return reject(err);
			return resolve(data);
		};
	});
	cb.promise = promise;
	return cb;
}

function filter(sources, rules) {
	rules = Array.isArray(rules) ? rules : [rules];
	let remained = [...sources];

	_.map(rules, (approve, pattern) => {
		const methods = _.filter(sources, minimatch.filter(pattern));
		if (approve) {
			remained = _.union(remained, methods);
		} else {
			remained = _.without(remained, ...methods);
		}
	});
	return remained;
}

/**
 * Disable remote methods
 * @param {Function} Model The model to process.
 * @param {String|Array} methods The methods to disable
 */
function disableRemoteMethods(Model, methods) {
	assert(typeof Model === 'function', 'Model must be a class (function)');
	methods = Array.isArray(methods) ? methods : [methods];
	methods.map(method => Model.disableRemoteMethodByName(method));
}

/**
 *
 * @param {Function} Model The model to process.
 * @param {String|Array} relations The relations to alter.
 * @param {Object} rules
 */
function updateRemoteRelationMethods(Model, relations, rules) {
	relations = Array.isArray(relations) ? relations : [relations];
	const disables = _.without(REL_METHODS, ...filter(REL_METHODS, rules));
	relations.forEach(rel => disableRemoteMethods(Model, _.map(disables, m => `prototype.__${m}__${rel}`)));
}

/**
 * Disables all remote methods on a model.
 * @param Model - The model to process.
 */
function hideAll(Model) {
	disableRemoteMethods(Model, [
		'find',
		'findById',
		'create',
		'upsert',
		'deleteById',
		'updateAll',
		'createChangeStream',
		'count',
		'findOne',
		'exists',
		'replaceOrCreate',
		'upsertWithWhere',
	]);
	disableRemoteMethods(Model, 'prototype.updateAttributes');
}
/**
 * Disables all write methods on a model, keeping only the GET.
 * @param Model - The model to process.
 */
function readOnly(Model) {
	disableRemoteMethods(Model, [
		'create',
		'upsert',
		'deleteById',
		'updateAll',
		'createChangeStream',
		'count',
		'findOne',
		'exists',
		'replaceOrCreate',
		'upsertWithWhere',
	]);
	disableRemoteMethods(Model, 'prototype.updateAttributes');
}
/**
 * Keeps only the simple GET/POST/PUT/DELETE methods.
 * @param Model - The model to process.
 */
function simpleCrud(Model) {
	disableRemoteMethods(Model, [
		'upsert',
		'updateAll',
		'createChangeStream',
		'count',
		'findOne',
		'exists',
		'replaceOrCreate',
		'upsertWithWhere',
	]);
}
/**
 * Keeps only the GET methods for the given relation
 * @param Model - The model to process.
 * @param relation - The relation to alter.
 */
function readOnlyRelation(Model, relation) {
	disableRemoteMethods(Model, [
		'prototype.__create__',
		'prototype.__updateById__',
		'prototype.__destroyById__',
		'prototype.__delete__',
		'prototype.__count__',
		'prototype.__findById__',
		'prototype.__link__',
		'prototype.__unlink__',
		'prototype.__exists__',
	].map(m => m + relation));
}
/**
 * Hides the given relation from the Model remote methods.
 * @param Model - The model to process.
 * @param relation - The relation to hide.
 */
function hideRelation(Model, relation) {
	disableRemoteMethods(Model, [
		'prototype.__create__',
		'prototype.__get__',
		'prototype.__update__',
		'prototype.__destroy__',
		'prototype.__delete__',
		'prototype.__updateById__',
		'prototype.__destroyById__',
		'prototype.__count__',
		'prototype.__findById__',
		'prototype.__link__',
		'prototype.__unlink__',
		'prototype.__exists__',
	].map(m => m + relation));
}
/**
 * Begins a transaction for the given model.
 *
 * Similar to Model.beginTransaction but in case the model is using the in-memory data source
 * that has no support for transaction, it returns a dummy transaction object and logs a warning.
 * @param Model - The model to begin a transaction for
 * @param callback - (err, tx)
 */
function beginTransaction(Model, callback) {
	callback = callback || createPromiseCallback();
	if (Model.dataSource.adapter.name === 'memory') {
		debug('Creating a fake transaction object for in-memory connector with model', Model.modelName);
		callback(null, {
			commit(callback) {
				debug('Commit on a fake transaction');
				callback(null);
			},
			rollback(callback) {
				debug('Rollback on a fake transaction');
				callback(null);
			}
		});
	} else {
		Model.beginTransaction({isolationLevel: Model.Transaction.SERIALIZABLE}, (err, tx) => callback(err, tx));
	}

	return callback.promise;
}

module.exports = {
	noop,
	createPromiseCallback,
	disableRemoteMethods,
	updateRemoteRelationMethods,
	hideAll,
	hideRelation,
	readOnly,
	simpleCrud,
	readOnlyRelation,
	beginTransaction
};
