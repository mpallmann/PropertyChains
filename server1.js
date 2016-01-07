var http = require('http') ;

http.createServer(function(req, res) {

	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write('NodeJS Server!');
	res.end();
	return;

}).listen(8001);