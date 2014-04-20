'use strict';

var through2 = require('through2');
var gutil = require('gulp-util');
var exec = require('child_process').exec;

var PLUGIN_NAME = 'gulp-exec';

function doExec(command, opt){
	if (!command) {
		throw new Error('command is blank');
	}

	if (!opt) {
		opt = {};
	}

	return through2.obj(function (file, enc, cb){
		var cmd = gutil.template(command, {file: file, options: opt});
		var that = this;

		exec(cmd, opt, function (err, stdout, stderr) {
			file.exec = {
				stdout: stdout.trim(),
				stderr: stderr.trim()
			};
			if (opt.pipeStdout) {
				file.exec.contents = file.contents;
				file.contents = new Buffer(stdout); // FRAGILE: if it wasn't a buffer it is now
			}
			if (err) {
				that.emit('err', new gutil.PluginError(PLUGIN_NAME, err));
			}
			that.push(file);
			cb();
		});
	});
}

function reporter(opt) {
	if (!opt) {
		opt = {};
	}

	if (typeof opt.stderr === 'undefined') {
		opt.stderr = true;
	}
	if (typeof opt.stdout === 'undefined') {
		opt.stdout = true;
	}

	return through2.obj(function (file, enc, cb) {
		if (file && file.exec) {
			var e = file.exec;
			if (e.stderr && opt.stderr) {
				gutil.log(e.stderr);
			}
			if (e.stdout && opt.stdout) {
				gutil.log(e.stdout);
			}
		}

		this.pipe(file);
		cb();
	});
}

module.exports = doExec;
module.exports.reporter = reporter;
