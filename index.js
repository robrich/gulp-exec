/*jshint node:true */

"use strict";

var map = require('map-stream'),
	gutil = require('gulp-util'),
	exec = require('child_process').exec;

module.exports = function(command, opt){
	if (!command) {
		throw new Error('command is blank');
	}
	// defaults
	if (!opt) {
		opt = {};
	}
	if (typeof opt.silent === 'undefined') {
		opt.silent = false;
	}
	if (typeof opt.continueOnError === 'undefined') {
		opt.continueOnError = false;
	}

    if (typeof opt.pipeStdout === 'undefined') {
        opt.pipeStdout = false;
    }

	return map(function (file, cb){
		var cmd = gutil.template(command, {file: file, options: opt});

		exec(cmd, function (error, stdout, stderr) {
			if (!opt.silent && stderr) {
				gutil.log(stderr);
			}
			if (stdout) {
				stdout = stdout.trim(); // Trim trailing cr-lf
			}
			if (!opt.silent && !opt.pipeStdout && stdout) {
				gutil.log(stdout);
			}
            if (opt.pipeStdout) {
                file.contents = new Buffer(stdout);
            }
			cb(opt.continueOnError ? null : error, file);
		});
	});
};
