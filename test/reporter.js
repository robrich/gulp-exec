/*global describe:false, it:false, beforeEach:false, afterEach:false */

'use strict';

var exec = require('../');

var Vinyl = require('vinyl');
var path = require('path');
var should = require('should');
var gutil = require('gulp-util');

describe('gulp-exec', function() {
	describe('reporter()', function() {
		var tempFileContent = 'A test generated this file and it is safe to delete';
		var base = path.join(__dirname, '../');
		var tempFile = path.join(base, './temp.txt');
		var relative = 'temp.txt';

		var realLog = gutil.log;

		var logContent = [];
		beforeEach(function () {
			gutil.log = function () {
				logContent.push(Array.prototype.join.call(arguments, ' '));
			};
		});
		afterEach(function () {
			gutil.log = realLog;
			logContent = [];
		});

		function getFakeFile() {
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});
			return fakeFile;
		}

		it('should pass file structure through', function(done) {
			// arrange
			var fakeFile = getFakeFile();

			var stream = exec.reporter();

			stream.on('data', function(actualFile){

				// assert
				// Test that content passed through
				should.exist(actualFile);
				should.exist(actualFile.path);
				should.exist(actualFile.relative);
				should.exist(actualFile.contents);
				actualFile.path.should.equal(tempFile);
				actualFile.relative.should.equal(relative);
				String(actualFile.contents).should.equal(tempFileContent);
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should report content', function(done) {
			// arrange
			var errData = 'this is err';
			var stdoutData = 'this is stdout';
			var stderrData = 'this is stderr';
			var fakeFile = getFakeFile();
			fakeFile.exec = {
				err: errData,
				stdout: stdoutData,
				stderr: stderrData
			};

			var stream = exec.reporter();

			stream.once('finish', function(){

				// assert
				logContent.length.should.equal(3);
				logContent[0].should.equal(stdoutData);
				logContent[1].should.equal(stderrData);
				logContent[2].should.equal(errData);

				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should not report content when disabled', function(done) {
			// arrange
			var errData = 'this is err';
			var stdoutData = 'this is stdout';
			var stderrData = 'this is stderr';
			var fakeFile = getFakeFile();
			fakeFile.exec = {
				err: errData,
				stdout: stdoutData,
				stderr: stderrData
			};

			var stream = exec.reporter({
				stdout: false,
				err: false
			});

			stream.once('finish', function(){

				// assert
				logContent.length.should.equal(1);
				logContent[0].should.equal(stderrData);

				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should report content when not disabled', function(done) {
			// arrange
			var errData = 'this is err';
			var stdoutData = 'this is stdout';
			var stderrData = 'this is stderr';
			var fakeFile = getFakeFile();
			fakeFile.exec = {
				err: errData,
				stdout: stdoutData,
				stderr: stderrData
			};

			var stream = exec.reporter({
				stdout: 'truthy',
				err: 'truthy'
			});

			stream.once('finish', function(){

				// assert
				logContent.length.should.equal(3);
				logContent[0].should.equal(stdoutData);
				logContent[1].should.equal(stderrData);
				logContent[2].should.equal(errData);

				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

	});
});
