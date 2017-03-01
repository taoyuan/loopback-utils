const assert = require('assert');
const Promise = require('bluebird');

let debug = noop;

try {
	debug = require('debug')('loopback-utils');
} catch (e) {
	// no-op
}

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

/**
 * Disable remote methods
 * @param {Function} Model The model to process.
 * @param {String|Array} methods The methods to disable
 * @param {Boolean} [isStatic] Is the method static (eg. `MyModel.myMethod`)? Pass
 * `false` if the method defined on the prototype (eg.
 * `MyModel.prototype.myMethod`).
 */
function disableRemoteMethods(Model, methods, isStatic) {
	assert(typeof Model === 'function', 'Model must be a class (function)');
	methods = Array.isArray(methods) ? methods : [methods];
	methods.map(method => Model.disableRemoteMethod(method, isStatic));
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
		'exists'
	]);
	disableRemoteMethods(Model, 'updateAttributes', false);
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
	]);
	disableRemoteMethods(Model, 'updateAttributes', false);
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
	]);
}
/**
 * Keeps only the GET methods for the given relation
 * @param Model - The model to process.
 * @param relation - The relation to alter.
 */
function readOnlyRelation(Model, relation) {
	disableRemoteMethods(Model, [
		'__create__',
		'__updateById__',
		'__destroyById__',
		'__delete__',
		'__count__',
		'__findById__',
		'__link__',
		'__unlink__',
		'__exists__',
	].map(m => m + relation), false);
}
/**
 * Hides the given relation from the Model remote methods.
 * @param Model - The model to process.
 * @param relation - The relation to hide.
 */
function hideRelation(Model, relation) {
	disableRemoteMethods(Model, [
		'__create__',
		'__get__',
		'__update__',
		'__destroy__',
		'__delete__',
		'__updateById__',
		'__destroyById__',
		'__count__',
		'__findById__',
		'__link__',
		'__unlink__',
		'__exists__',
	].map(m => m + relation), false);
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
	hideAll,
	hideRelation,
	readOnly,
	simpleCrud,
	readOnlyRelation,
	beginTransaction
};
