/*jshint node:true */
/*global describe:false, it:false */

"use strict";

var exec = require('../');
var gutil = require('gulp-util');
var path = require('path');
var fs = require('fs');
var should = require('should');
require('mocha');

describe('gulp-exec', function() {
	describe('exec()', function() {
		var tempFileContent = 'A test generated this file and it is safe to delete';

		it('should pass file structure through', function(done) {
			// Arrange
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var relative = 'temp.txt';
			var fakeFile = new gutil.File({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var stream = exec('echo hi');

			// Assert
			stream.on('data', function(actualFile){
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

			// Act
			stream.write(fakeFile);
			stream.end();
		});

		it('should execute a command with options and templating', function(done) {
			// Arrange
			var ext = 'out';
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var relative = 'temp.txt';
			var fakeFile = new gutil.File({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			fs.writeFileSync(tempFile, tempFileContent);
			fs.existsSync(tempFile).should.equal(true);

			var stream = exec('cp "<%= file.path %>" "<%= file.path %>.<%= options.ext %>"', {ext: ext});

			// Assert
			stream.once('end', function(/*actualFile*/){
				// Test that command executed
				fs.existsSync(tempFile+'.'+ext).should.equal(true);
				done();
			});

			// Act
			stream.write(fakeFile);
			stream.end();
		});

		it('should error on invalid command', function(done) {
			// Arrange
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var relative = 'temp.txt';
			var fakeFile = new gutil.File({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var cmd = 'not_a_command';
			fs.writeFileSync(tempFile, tempFileContent);
			fs.existsSync(tempFile).should.equal(true);

			var stream = exec(cmd);

			var err;
			// Swap out error handling
			var originalException = process.listeners('uncaughtException').pop();
			process.removeListener('uncaughtException', originalException);
			process.once("uncaughtException", function (error) {
				err = error;
			});

			// Assert
			setTimeout(function(){
				// Put error handling back
				process.listeners('uncaughtException').push(originalException);

				// Test that it errored
				should.exist(err);
				should.exist(err.message);
				err.message.indexOf(cmd).should.be.above(-1);
				done();
			}, 100);

			// Act
			stream.write(fakeFile);
			stream.end();
		});

		it('should not emit error when `continueOnError == true`', function (done) {
			// Arrange
			var fakeFile = new gutil.File();
			var cmd = 'not_a_command';

			var stream = exec(cmd, {continueOnError: true});

			var emitted = false;
			stream.on('error', function () {
				emitted = true;
			});

			// Assert
			stream.on('end', function () {
				emitted.should.be.false;
				done();
			});

			// Act
			stream.write(fakeFile);
			stream.end();
		});

	});
});
