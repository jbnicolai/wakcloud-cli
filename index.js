var actions = require('./actions');
var storage = require('node-persist');
var chalk = require("chalk");

storage.initSync();
console.log(chalk.cyan(require('fs').readFileSync('./files/intro') + ""));

if(storage.getItem('cookies')){
        actions.run();
}else{
        actions.login();
}
