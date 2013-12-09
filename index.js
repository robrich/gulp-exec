/*jshint node:true */

"use strict";

var es = require('event-stream'),
	gutil = require('gulp-util'),
	path = require('path'),
	exec = require('child_process').exec;

module.exports = function(command, opt){
	if (!command) {
		throw new Error('command is blank');
	}
	// defaults
	if (!opt) {
		opt = {
			silent: false
		};
	}
	return es.map(function (file, cb){
		opt.file = file;
		var cmd = gutil.template(command, opt);

		exec(cmd, function (error, stdout, stderr) {
			if (stderr) {
				gutil.log(stderr);
			}
			if (stdout) {
				stdout = stdout.trim(); // Trim trailing cr-lf
			}
			if (stdout) {
				gutil.log(stdout);
			}
			cb(error, file);
		});
	});
};
