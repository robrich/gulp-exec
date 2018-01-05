'use strict';

var through2 = require('through2');
var path = require('path');
var PluginError = require('plugin-error');
var fancyLog = require('fancy-log');
var template = require('lodash.template');
var exec = require('child_process').exec;

var PLUGIN_NAME = 'gulp-exec';

function escapeRegExp(val) {
	return val.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function doExec(command, opt){
	if (!command) {
		throw new Error('command is blank');
	}

	if (!opt) {
		opt = {};
	}

	if (!opt.env) {
		opt.env = process.env;
	}

	// Include node_modules/.bin on the path when we execute the command.
	var oldPath = opt.env.PATH;
	var newPath = path.join(__dirname, '..', '..', '.bin');
	var regExp = new RegExp("(^|" + escapeRegExp(path.delimiter) + ")" + escapeRegExp(newPath) + "(" + escapeRegExp(path.delimiter) + "|$)");
	if (!regExp.exec(oldPath)) {
		newPath += path.delimiter;
		newPath += oldPath;
		opt.env.PATH = newPath;
	}

	return through2.obj(function (file, enc, cb){
		var cmd = template(command)({file: file, options: opt});
		var that = this;

		exec(cmd, opt, function (err, stdout, stderr) {
			file.exec = {
				err: err,
				stdout: stdout.trim(),
				stderr: stderr.trim()
			};
			if (opt.pipeStdout) {
				file.exec.contents = file.contents;
				file.contents = new Buffer(stdout); // FRAGILE: if it wasn't a buffer it is now
			}
			if (err && !opt.continueOnError) {
				that.emit('error', new PluginError(PLUGIN_NAME, err));
			}
			that.push(file);
			cb();
		});
	});
}

function reporter(opt){
	if (!opt) {
		opt = {};
	}

	if (typeof opt.err === 'undefined') {
		opt.err = true;
	}
	if (typeof opt.stderr === 'undefined') {
		opt.stderr = true;
	}
	if (typeof opt.stdout === 'undefined') {
		opt.stdout = true;
	}

	return through2.obj(function (file, enc, cb){
		if (file && file.exec) {
			var e = file.exec;
			if (e.stdout && opt.stdout) {
				fancyLog.info(e.stdout);
			}
			if (e.stderr && opt.stderr) {
				fancyLog.info(e.stderr);
			}
			if (e.err && opt.err) {
				fancyLog.info(e.err);
			}
		}

		this.push(file);
		cb();
	});
}

module.exports = doExec;
module.exports.reporter = reporter;
