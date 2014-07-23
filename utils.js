var http = require('http');

function send(options, data) {
	var thenCB = new Function();
	var errCB = new Function();

	data = (data && typeof data == 'object')? JSON.stringify(data): data;
	options = options || {};
	options.headers= options.headers || {};

	var req = http.request(options, function(res) {
		res.on('data', function(chunk) {
			if(/^2/.test(res.statusCode.toString())){
				thenCB.call(this, chunk, res);
			}else{
				errCB.call(this, chunk, res);
			}
		});
	});

	req.on('error', function(e) {
		errCB.call(this, e);
	});

	if(data){
		options.headers['content-type'] = 'application/json';
		req.write(data);
	}

	req.end();
	
	return {
		then: function(fn) {
			if(typeof fn == 'function'){
				thenCB = fn;
			}

			return this;
		},
		error: function(fn){
			if(typeof fn == 'function'){
				errCB = fn;
			}

			return this;
		}
	};
}

exports.send = send;