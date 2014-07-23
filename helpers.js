var Table = require('cli-table');

var appsMeta = {
	head: [],
	colWidths: [],
	columns: [{
		value: 'id',
		width: 6,
		title: 'ID'
	}, {
		value: 'offer',
		title: 'Offer',
		width: 20
	}, {
		value: 'app_state',
		title: 'State',
		width: 15
	}, {
		value: 'created',
		title: 'Creation date',
		width: 21
	}, {
		value: function(row) {
			return 'http://' + row.domain + row.regionSuffix + '/';
		},
		title: 'Domain',
		width: 50
	}]
};

var logsMeta = {
	head: [],
	colWidths: [],
	columns: [{
		value: function(row){
			return row.user.fullname;
		},
		width: 40,
		title: 'User'
	}, {
		value: 'action',
		title: 'Action',
		width: 15
	}, {
		value: 'entity',
		title: 'Entity',
		width: 15
	}, {
		value: 'element',
		title: 'Element',
		width: 10
	}, {
		value: 'timestamp',
		title: 'Date',
		width: 30
	}]
};

(function(aM) {
	for (var i = 0, c; c = aM.columns[i]; i++) {
		aM.head.push(c.title);
		aM.colWidths.push(c.width);
	}
})(appsMeta);

(function(lM) {
	for (var i = 0, c; c = lM.columns[i]; i++) {
		lM.head.push(c.title);
		lM.colWidths.push(c.width);
	}
})(logsMeta);

function getCookies(cookies) {
	var res = {};

	if (Array.isArray(cookies)) {
		cookies.forEach(function(c) {
			c = c.substr(0, c.indexOf(';'));
			c = c.split('=');
			res[c[0]] = c[1];
		});
	}

	return res;
}

exports.cookies = getCookies;

exports.format = function(type, content) {
	var meta = null;

	switch (type) {
		case 'apps':
			meta = appsMeta;
			break;
		case 'logs':
			meta = logsMeta;
			break;
		case 'info':
			var t = new Table({
				head: [],
				colWidths: [20, 50]
			});

			appsMeta.columns.forEach(function(c){
				t.push([c.title, typeof c.value == 'function'? c.value(content): content[c.value]]);
			});
			console.log(t.toString());
			return;
			break;
	}

	if(meta){
		if (Array.isArray(content)) {
			var table = new Table({
				head: meta.head,
				colWidths: meta.colWidths
			});
			
			content.forEach(function(app) {
				var row = [];
				for (var i = 0, c; c = meta.columns[i]; i++) {
					if (typeof c.value == 'function') {
						row.push(c.value(app));
					} else {
						row.push(app[c.value]);
					}
				}
				table.push(row);
			});

			console.log(table.toString());
		}
	}
};