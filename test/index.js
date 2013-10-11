/*jshint node:true */
/*global describe:false, it:false */

"use strict";

var exec = require('../');
var fs = require('fs');
var should = require('should');
require('mocha');

describe('gulp-exec', function() {
	describe('exec()', function() {
		var tempFileContent = 'A test generated this file and it is safe to delete';

		it('should pass file structure through', function(done) {
			// Arrange
			var tempFile = './temp.txt';
			var tempFileShort = 'temp.txt';

			var stream = exec('echo hi');
			var fakeFile = {
				path: tempFile,
				shortened: tempFileShort,
				contents: new Buffer(tempFileContent)
			};

			// Assert
			stream.on('data', function(actualFile){
				// Test that content passed through
				should.exist(actualFile);
				should.exist(actualFile.path);
				should.exist(actualFile.shortened);
				should.exist(actualFile.contents);
				actualFile.path.should.equal(tempFile);
				actualFile.shortened.should.equal(tempFileShort);
				String(actualFile.contents).should.equal(tempFileContent);
				done();
			});

			// Act
			stream.write(fakeFile);
			stream.end();
		});

		it('should execute a command', function(done) {
			// Arrange
			var tempFile = './temp.txt';
			var tempFileShort = 'temp.txt';
			fs.writeFileSync(tempFile, tempFileContent);
			fs.existsSync(tempFile).should.equal(true);

			var stream = exec('cp "$file" "$file.out"');
			var fakeFile = {
				path: tempFile,
				shortened: tempFileShort,
				contents: new Buffer(tempFileContent)
			};

			// Assert
			stream.once('end', function(/*actualFile*/){
				// Test that command executed
				fs.existsSync(tempFile+'.out').should.equal(true);
				done();
			});

			// Act
			stream.write(fakeFile);
			stream.end();
		});

		it('should error on invalid command', function(done) {
			// Arrange
			var tempFile = './temp.txt';
			var tempFileShort = 'temp.txt';
			var cmd = 'not_a_command';
			fs.writeFileSync(tempFile, tempFileContent);
			fs.existsSync(tempFile).should.equal(true);

			var stream = exec(cmd);
			var fakeFile = {
				path: tempFile,
				shortened: tempFileShort,
				contents: new Buffer(tempFileContent)
			};

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

	});
});
