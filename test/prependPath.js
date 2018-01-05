/*global describe:false, it:false, afterEach */

'use strict';

var prependPath = require('../prependPath');

var should = require('should');

describe('gulp-exec', function() {
	describe('prependPath()', function() {
		var realPath = process.env.PATH;

		afterEach(function () {
			process.env.PATH = realPath;
		});

		it('should change path', function(done) {
			// arrange
			var startPath = process.env.PATH;

			// act
			prependPath(process.env);

			// assert
			var endPath = process.env.PATH;
			endPath.should.not.equal(startPath);

			done();
		});

		it('should change path when not passed process.env', function(done) {
			// arrange
			var startPath = process.env.PATH;

			// act
			prependPath();

			// assert
			var endPath = process.env.PATH;
			endPath.should.not.equal(startPath);

			done();
		});

		it('should not prepend path if already exists', function(done) {
			// arrange
			prependPath(process.env); // this should make it exist
			var startPath = process.env.PATH;

			// act
			prependPath(process.env);

			// assert
			var endPath = process.env.PATH;
			endPath.should.equal(startPath);

			done();
		});

		it('should not blow out path', function(done) {
			// arrange
			var exception; // = undefined;

			// act
			try {
				for (var i = 0; i < 1000; i++) {
					prependPath(process.env);
				}
			} catch (err) {
				exception = err;
			}

			// assert
			should.not.exist(exception);

			done();
		});

	});
});
