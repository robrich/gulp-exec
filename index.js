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
		opt = {};
	}
	if (typeof opt.silent === 'undefined') {
		opt.silent = false;
	}

	return es.map(function (file, cb){
		var cmd = gutil.template(command, {file: file, options: opt});

		exec(cmd, function (error, stdout, stderr) {
			if (!opt.silent && stderr) {
				gutil.log(stderr);
			}
			if (stdout) {
				stdout = stdout.trim(); // Trim trailing cr-lf
			}
			if (!opt.silent && stdout) {
				gutil.log(stdout);
			}
			cb(error, file);
		});
	});
};
