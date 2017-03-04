'use strict';

const assert = require('chai').assert;
const errors = require('..').errors;

describe('errors', () => {
	it('should throw model not found error', () => {
		assert.throws(() => {
			throw errors.modelNotFound('User', {a: 'b', c: 'd'});
		}, /Unknown "User" for { a: 'b', c: 'd' }/);
	});
});
