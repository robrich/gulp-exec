'use strict';

var path = require('path');

function prependPath(env) {
	if (!env) {
		env = process.env;
	}
	// Include node_modules/.bin on the path when we execute the command.
	// FRAGILE: ASSUME: this is a top-level module, hasn't been de-duped into a sub-directory
	// TODO: if this becomes a problem, resolve node_modules/.bin using npm-which or npm-path or similar or invite users to use npx <command>
	var oldPath = env.PATH;
	var newPath = path.resolve(path.join(__dirname, '..', '.bin'));
	if (oldPath.indexOf(newPath) === -1) {
		newPath += path.delimiter;
		newPath += oldPath;
		env.PATH = newPath;
	}
}

module.exports = prependPath;
