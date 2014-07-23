var actions = require('./actions');
var storage = require('node-persist');

storage.initSync();
console.log(require('fs').readFileSync('./files/intro') + "");

if(storage.getItem('cookies')){
	actions.run();
}else{
	actions.login();
}