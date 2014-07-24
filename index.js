exports.run = function() {
	var actions = require('./actions');
	var storage = require('node-persist');
	var chalk = require("chalk");

	storage.initSync({
		dir: __dirname + '/persist'
	});
	console.log(chalk.cyan(require('fs').readFileSync(__dirname + '/files/intro') + ""));

	if (storage.getItem('cookies')) {
		actions.run();
	} else {
		actions.login();
	}
}

if (require.main === module) {
	exports.run();
}