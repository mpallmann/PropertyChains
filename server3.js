var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');
var mimeTypes = {
    "html": "text/html",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "js": "text/javascript",
    "css": "text/css"};
	
http.createServer(function(req, res) {
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd(), unescape(uri));
	var stats;

  	if (uri.startsWith('/add')) {
		var args = req.url.substring(5).split('&');
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write('Cmd: Add\n');
		res.write('args:');
		var total = 0 ;
		for (i=0; i<args.length; i++) {
			res.write(' ' + args[i]) ;
			var items = args[i].split('=');
			total += parseInt(items[1]) ;
		}
		res.write('\n\ntotal: ' + total) ;
		res.end();
	} else {
	  try {
		stats = fs.lstatSync(filename); // throws if path doesn't exist
	  } catch (e) {
		res.writeHead(404, {'Content-Type': 'text/plain'});
		res.write('404 Not Found: ' + uri + '\n');
		res.end();
		return;
	  }

	  if (stats.isFile()) {
		// path exists, is a file
		var mimeType = mimeTypes[path.extname(filename).split(".").reverse()[0]];
		res.writeHead(200, {'Content-Type': mimeType} );

		var fileStream = fs.createReadStream(filename);
		fileStream.pipe(res);
	  } else if (stats.isDirectory()) {
		if (uri == '/') {
			var fileStream = fs.createReadStream('index.html');
			fileStream.pipe(res);
		} else {
			// path exists, is a directory
			res.writeHead(200, {'Content-Type': 'text/plain'});
			res.write('Index of '+uri+'\n');
			res.write('TODO, show index?\n');
			res.end();
		}
	  } else {
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write('URI: ' + uri);
		res.end();
		// Symbolic link, other?
		// TODO: follow symlinks?  security?
		//res.writeHead(500, {'Content-Type': 'text/plain'});
		//res.write('500 Internal server error\n');
		//res.end();
	  }
	}

}).listen(8001);