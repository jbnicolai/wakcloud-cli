var requestify = require('requestify');
var helpers = require('./helpers');
var storage = require('node-persist');

var console_url = "http://console.wakcloud.com/";

exports.cookies = storage.getItem('cookies');
exports.current = null;
storage.initSync({
	dir: __dirname + '/persist'
});

exports.login = function(credentials, callback) {
	credentials = credentials || {
		l: process.env.WAKCLOUD_LOGIN,
		p: process.env.WAKCLOUD_PASSWORD
	};

	if (credentials.l && credentials.p) {
		return requestify
			.post(console_url + 'account/login', credentials)
			.then(function(response) {
				if (response.getCode() === 200) {
					exports.cookies = helpers.cookies(response.getHeader('set-cookie'));
					storage.setItem('cookies', exports.cookies);
				}

				if (typeof callback == 'function') {
					callback.apply(this, arguments);
				}
			}).fail(function(response) {
				if (typeof callback == 'function') {
					callback.apply(this, arguments);
				}
			});
	}

	return 401;
};

function execute(fn) {
	if(!exports.cookies){
		exports.cookies = storage.getItem('cookies');
	}

	if (exports.cookies) {
		return fn.apply(this);
	}

	return 401;
}

exports.logout = function() {
	if(!exports.cookies){
		exports.cookies = storage.getItem('cookies');
	}

	if(exports.cookies){
		storage.removeItem('cookies');
		
		return requestify.request(console_url + 'account/logout', {
			cookies: exports.cookies,
			method: 'GET'
		}).then(function(){
			process.exit();
		});
	}else{
		process.exit();
	}
};

exports.list = function() {
	return execute.call(this, function() {
		return requestify.get(console_url + 'subscriptions', {
			cookies: exports.cookies
		});
	});
};

exports.create = function(app) {
	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions', {
			body: {
				lines: app
			},
			cookies: exports.cookies,
			method: 'PUT'
		});
	});
};

exports.start = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id + '/start', {
			cookies: exports.cookies,
			method: 'POST'
		});
	});
};

exports.stop = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id + '/stop', {
			cookies: exports.cookies,
			method: 'POST'
		});
	});
};

exports.reload = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id + '/reload', {
			cookies: exports.cookies,
			method: 'POST'
		});
	});
};

exports.remove = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.delete(console_url + 'subscriptions/' + id, {
			cookies: exports.cookies,
			method: 'DELETE'
		}).then(function(){

		});
	});
};

exports.logs = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id + '/logs', {
			cookies: exports.cookies,
			method: 'GET'
		});
	});
};

exports.status = exports.info = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id, {
			cookies: exports.cookies,
			method: 'GET'
		});
	});
};

exports.permissions = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id + '/permissions', {
			cookies: exports.cookies,
			method: 'GET'
		});
	});
};

exports.domains = function(id) {
	id = id || exports.current;

	return execute.call(this, function() {
		return requestify.request(console_url + 'subscriptions/' + id + '/domains', {
			cookies: exports.cookies,
			method: 'GET'
		});
	});
};