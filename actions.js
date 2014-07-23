var wakcloud = require('./wakcloud');
var helpers = require('./helpers');
var inquirer = require("inquirer");
var chalk = require('chalk');
var config = require('./config');
var error = chalk.bold.red;
var apps = null;

function login() {
	console.log(error('Your session has expired, please login again'));
	exports.login();
}

function execAction(id, ac) {
	wakcloud[ac].apply(wakcloud[ac], [id]).then(function(response) {
		switch (ac) {
			case 'logs':
				helpers.format('logs', response.getBody());
				break;
			case 'permissions':
				console.log(response.getBody());
				break;
			case 'status':
				var app = response.getBody();
				var color = chalk.bold;

				switch(app.app_state){
					case 'active':
						color = color.green;
						break
					case 'inactive':
						color = color.red;
						break
					default:
						color = color.yellow;
						break
				}

				console.log(color(app.app_state));
				break;
			case 'info':
				helpers.format('info', response.getBody());
				break;
			default:
				break;
		}

		exports.run();
	}).fail(fail);
}

function fail(response) {
	var launchPrompt = true;

	switch (response.getCode()) {
		case 401:
			launchPrompt = false;
			login();
			break;
		case 404:
			console.log(error('The selected application does not exist!'));
			wakcloud.current = null;
			break;
		case 403:
			console.log(error("You don't have enough permissions to perform that action!"));
			break;
		case 409:
			console.log(error("Conflict!"));
			break;
		default:
			console.log(error('An unknown error has occured.'));
			break;
	}

	if(launchPrompt){
		exports.run();
	}
}

function promptMultiple(fn, exitStr, message){
	exitStr = typeof exitStr !== 'string'? '': exitStr;
	message = typeof message !== 'string'? ' ': message;

	var result = [];

	function prompt(){
		inquirer.prompt([{
			name: 'response',
			message: message
		}], function(answers) {
			if(answers.response === exitStr){
				console.log(chalk.cyan(JSON.stringify(result)));

				if(typeof fn === "function"){
					fn(result);
				}
			}else{
				result.push(answers.response);
				prompt();
			}
		});
	}

	prompt();
}

exports.login = function() {
	var questions = [{
		validate: function(value) {
			if (!/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value)) {
				return error('The email is invalid');
			}

			return true;
		},
		name: 'l',
		message: 'Your email'
	}, {
		type: 'password',
		name: 'p',
		message: 'Your password'
	}];
	var nbTimes = 0;

	function ask() {
		if (nbTimes < 3) {
			inquirer.prompt(questions, function(answers) {
				wakcloud.login(answers, function(response) {
					if (response.getCode() !== 200) {
						nbTimes++;
						console.log(error('error: ') + chalk.gray('Invalid login or password\n'));
						ask();
					} else {
						exports.run();
					}
				});
			});
		} else {
			process.exit(0);
		}
	}

	ask();
};

exports.ll = exports.list = function(fn) {
	var l = wakcloud.list();

	if (typeof l == 'number') {
		login();
		return false;
	}

	l.then(function(response) {
		apps = response.getBody();

		if (typeof fn === 'function') {
			fn(apps);
		} else {
			helpers.format('apps', apps);
			exports.run();
		}
	}).fail(fail);
};

exports.select = function(id, callback) {
	function chooseApp(applications) {
		var choices = [];
		applications.forEach(function(app) {
			choices.push({
				name: '[' + app.id + '] http://' + app.domain + app.regionSuffix + '/',
				value: app.id
			});
		});

		inquirer.prompt([{
			name: 'app',
			message: 'Choose the application',
			choices: choices,
			type: 'list'
		}], function(answers) {
			if(typeof callback === 'function'){
				callback(answers.app);
			}else{
				wakcloud.current = answers.app;
				exports.run();
			}
		});
	}

	if (!id) {
		if (apps) {
			chooseApp(apps);
		} else {
			exports.list(chooseApp);
		}
	} else {
		wakcloud.current = id;
		exports.run();
	}
};

exports.create = function(){
	inquirer.prompt([{
		name: 'offer',
		message: 'Select the offer',
		choices: config.offers,
		type: 'list'
	}, {
		name: 'region',
		message: 'Select the region',
		choices: config.regions,
		type: 'list'
	}, {
		name: 'domain',
		message: "Pick a domain",
		validate: function(value) {
			if (!/^[a-z0-9][a-z0-9\-]{0,61}[a-z0-9]$/.test(value)) {
				return error('Invalid domain');
			}

			return true;
		}
	}], function(answers) {
		var app = {
			offer: answers.offer,
			region: answers.region,
			domain: answers.domain,
			subdomains: [],
			cnames: []
		};

		var p = "[" + chalk.green('?') + "] ";

		console.log(p + "Add subdomains (An empty string to validate)");
		promptMultiple(function(result){
			app.subdomains = result;

			console.log(p + "Add custom domains (An empty string to validate)");
			
			promptMultiple(function(result){
				app.cnames = result;
				wakcloud.create(app).then(function(){
					console.log(chalk.cyan("Application created successfully!"));
					exports.run();
				}).fail(fail);
			});
		});
	});
};

(function() {
	var actions = ['start', 'stop', 'reload', 'delete', 'remove', 'logs', 'permissions', 'status', 'info'];
	var that = exports;

	actions.forEach(function(ac) {
		exports[ac] = function(id) {
			id = id || wakcloud.current;

			if (!id) {
				that.select(id, function(appID){
					that[ac](appID);
				});
			} else {
				var confirm = ['delete', 'stop', 'remove'].indexOf(ac) >= 0;

				if (confirm) {
					inquirer.prompt([{
						name: 'confirm',
						type: 'confirm',
						message: 'Do you realy want to ' + ac + ' the selected application?'
					}], function(answers) {
						if (answers.confirm) {
							execAction(id, ac);
						} else {
							that.run();
						}
					});
				} else {
					execAction(id, ac);
				}
			}
		};
	});
})();

exports.run = function() {
	setTimeout(function() {
		inquirer.prompt([{
			name: 'command',
			message: '>'
		}], function(answers) {
			var command = answers.command.trim().split(' ');
			var cmd = command.shift() || "";

			cmd = cmd.trim();

			switch (true) {
				case cmd === 'exit':
					process.exit();
					break;
				case cmd === 'help':
				case cmd === '?':
					console.log(require('fs').readFileSync('./files/help') + "");
					exports.run();
					break;
				case cmd === '':
					exports.run();
					break;
				case cmd === "unselect":
					if(wakcloud.current){
						wakcloud.current = null;
					}else{
						console.log(error('No selected application.'));
					}

					exports.run();
					break;
				case cmd === "logout":
					wakcloud.logout();
					break;
				case exports.hasOwnProperty(cmd) && ['login', 'run'].indexOf(cmd) < 0:
					exports[cmd].apply(exports[cmd], command);
					break;
				default:
					console.log(error('Unknown command!'));
					exports.run();
					break;
			}
		});
	}, 100);
};
