'use strict';

var through2 = require('through2');
var PluginError = require('plugin-error');
var exec = require('child_process').exec;
var prependPath = require('./prependPath');

var PLUGIN_NAME = 'gulp-exec';

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

	prependPath(opt.env);

	return through2.obj(function (file, enc, cb){
		var cmd = typeof command === 'function' ? command(file) : command;
		var that = this;

		exec(cmd, opt, function (err, stdout, stderr) {
			file.exec = {
				err: err,
				stdout: stdout.trim(),
				stderr: stderr.trim()
			};
			if (opt.pipeStdout) {
				file.exec.contents = file.contents;
				file.contents = Buffer.from(stdout, opt.encoding); // FRAGILE: if it wasn't a buffer it is now
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
				console.log(e.stdout);
			}
			if (e.stderr && opt.stderr) {
				console.error(e.stderr);
			}
			if (e.err && opt.err) {
				console.error(e.err);
			}
		}

		this.push(file);
		cb();
	});
}

module.exports = doExec;
module.exports.reporter = reporter;
