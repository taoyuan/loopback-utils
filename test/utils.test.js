'use strict';

const assert = require('chai').assert;

describe('utils', () => {
	it('should export utils object', () => {
		assert.isObject(require('..'));
	});
});
