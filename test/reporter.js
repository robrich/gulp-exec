/*global describe:false, it:false, afterEach:false */

'use strict';

var exec = require('../');

var Vinyl = require('vinyl');
var path = require('path');
var should = require('should');

describe('gulp-exec', function() {
	describe('reporter()', function() {
		var tempFileContent = 'A test generated this file and it is safe to delete';
		var base = path.join(__dirname, '../');
		var tempFile = path.join(base, './temp.txt');
		var relative = 'temp.txt';

		var realConsoleError = console.error;
		var realConsoleLog = console.log;
		var realPath = process.env.PATH;

		var logContent = [];
		function testLog() {
			logContent.push(Array.prototype.join.call(arguments, ' '));
		}
		function setupTestLog() {
			console.error = testLog;
			console.log = testLog;
		}
		function restoreRealLog() {
			console.error = realConsoleError;
			console.log = realConsoleLog;
		}
		afterEach(function () {
			restoreRealLog();
			logContent = [];
			process.env.PATH = realPath;
		});

		function getFakeFile() {
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: Buffer.from(tempFileContent)
			});
			return fakeFile;
		}

		it('should pass file structure through', function(done) {
			// arrange
			var fakeFile = getFakeFile();

			var stream = exec.reporter();

			stream.on('data', function(actualFile){
				restoreRealLog();

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
			setupTestLog();
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
				restoreRealLog();

				// assert
				logContent.length.should.equal(3);
				logContent[0].should.equal(stdoutData);
				logContent[1].should.equal(stderrData);
				logContent[2].should.equal(errData);

				done();
			});

			// act
			setupTestLog();
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
				restoreRealLog();

				// assert
				logContent.length.should.equal(1);
				logContent[0].should.equal(stderrData);

				done();
			});

			// act
			setupTestLog();
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
				restoreRealLog();

				// assert
				logContent.length.should.equal(3);
				logContent[0].should.equal(stdoutData);
				logContent[1].should.equal(stderrData);
				logContent[2].should.equal(errData);

				done();
			});

			// act
			setupTestLog();
			stream.write(fakeFile);
			stream.end();
		});

	});
});
