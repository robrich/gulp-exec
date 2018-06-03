/*global describe:false, it:false, afterEach:false */

'use strict';

var exec = require('../');
var prependPath = require('../prependPath');

var Vinyl = require('vinyl');
var path = require('path');
var fs = require('fs');
var should = require('should');

describe('gulp-exec', function() {
	describe('exec()', function() {
		var tempFileContent = 'A test generated this file and it is safe to delete';
		var tempBinaryFileContent = '\x89';
		var realPath = process.env.PATH;

		afterEach(function () {
			process.env.PATH = realPath;
		});

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

			var actualErr;
			stream.on('error', function (err) {
				actualErr = err;
			});

			stream.once('finish', function () {

				// assert
				should.exist(actualErr);
				should.exist(actualErr.message);
				actualErr.message.indexOf(cmd).should.be.above(-1);
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
			stream.on('error', function () {
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

			var emitted = false;
			stream.on('error', function () {
				emitted = true;
			});

			// assert
			stream.once('finish', function(){
				// Test that command executed
				// If we got here, exec didn't die
				emitted.should.equal(true);
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should prepend to path', function(done) {
			// arrange
			var startPath = process.env.PATH;
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var stream = exec('echo hi');

			// assert
			stream.once('finish', function(){
				// If we got here, exec didn't die

				// Test that path is unchanged
				var endPath = process.env.PATH;
				endPath.should.not.equal(startPath);

				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should not prepend to path if already exists', function(done) {
			// arrange
			prependPath(process.env);
			var startPath = process.env.PATH;
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.txt');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: new Buffer(tempFileContent)
			});

			var stream = exec('echo hi');

			// assert
			stream.once('finish', function(){
				// If we got here, exec didn't die

				// Test that path is changed
				var endPath = process.env.PATH;
				endPath.should.equal(startPath);

				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

		it('should correctly handle binary data from stdout', function(done) {
			// arrange
			var base = path.join(__dirname, '../');
			var tempFile = path.join(base, './temp.bin');			
			var tempFileBuffer = new Buffer(tempBinaryFileContent, 'binary');
			var fakeFile = new Vinyl({
				base: base,
				cwd: base,
				path: tempFile,
				contents: tempFileBuffer
			});
			var options = {
				continueOnError: false,
				pipeStdout: true,
				encoding: 'binary'
			};

			fs.writeFileSync(tempFile, tempFileBuffer, 'binary');
			fs.existsSync(tempFile).should.equal(true);

			var stream = exec('cat "<%= file.path %>"', options);

			// assert
			stream.on('data', function(result){				
				should.exist(result);				
				should.exist(result.contents);
				var isBuffersEqual = result.contents.equals(tempFileBuffer);				
				isBuffersEqual.should.equal(true);				
				done();
			});

			// act
			stream.write(fakeFile);
			stream.end();
		});

	});
});
