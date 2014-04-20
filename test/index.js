/*global describe:false, it:false */

'use strict';

var exec = require('../');

var Vinyl = require('vinyl');
var path = require('path');
var fs = require('fs');
var should = require('should');

describe('gulp-exec', function() {
	describe('exec()', function() {
		var tempFileContent = 'A test generated this file and it is safe to delete';

		it('should pass file structure through', function(done) {
			// arrange
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var relative = 'temp.txt';
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var stream = exec('echo hi');

			// assert
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

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should execute a command with options and templating', function(done) {
			// arrange
			var ext = 'out';
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			fs.writeFileSync(tempFile, tempFileContent);
			fs.existsSync(tempFile).should.equal(true);

			var stream = exec('cp "<%= file.path %>" "<%= file.path %>.<%= options.ext %>"', {ext: ext});

			// assert
			stream.once('finish', function(){
				// Test that command executed
				fs.existsSync(tempFile+'.'+ext).should.equal(true);
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should error on invalid command', function(done) {
			// arrange
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var cmd = 'not_a_command';

			var stream = exec(cmd);

			stream.once('err', function (err) {

				// assert
				should.exist(err);
				should.exist(err.message);
				err.message.indexOf(cmd).should.be.above(-1);
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should not emit error when `continueOnError == true`', function (done) {
			// arrange
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var cmd = 'not_a_command';

			var stream = exec(cmd, {continueOnError: true});

			var emitted = false;
			stream.on('err', function () {
				emitted = true;
			});

			// assert
			stream.on('finish', function () {
				emitted.should.equal(false);
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should not exit if command results in error status', function(done) {
			// arrange
			var ext = 'out';
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var stream = exec('exit 2', {ext: ext});

			// assert
			stream.once('finish', function(){
				// Test that command executed
				// If we got here, exec didn't die
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

	});
});
