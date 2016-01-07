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
//var chains = [] ;

var PropertyChain = function() {
	this.id = '' ;
	this.properties = [];
	this.setPropertyValue = function(pv) {
		//check if exists
		var found = false ;
		for (i=0; i<this.properties.length; i++) {
			if (this.properties[i].key == pv.key) {
				found = true ;
				this.properties[i].value = pv.value;
			}
		}
		if (!found) this.properties.push(pv) ;
	}
	this.getPropertyValue = function(key) {
		for (i=0; i<this.properties.length; i++) {
			if (this.properties[i].key == key) return this.properties[i] ;
		}
		
		return null ;
	}
}
	
var PropertyValue = function() {
	this.key = '' ;
	this.value = '' ;
}
	
var PropertyChainServer = function() {
	this.chains = [] ;
	this.debug = false ;
	this.processRequest = function(req, res) {

		var output = '' ;
		var args = req.url.substring(12).split('&');
		var id='' ;
		var cmd='' ;
		var key='' ;
		var value='' ;
		
		for (i=0; i<args.length; i++) {
			var items = args[i].split('=');
			if (items[0] == 'id') id=items[1] ;
			if (items[0] == 'cmd') cmd=items[1] ;
			if (items[0] == 'key') key=items[1] ;
			if (items[0] == 'value') value=items[1] ;
		}
		
		if (cmd != '') {
			if (this.debug) output += "DEBUG: Processing command '" + cmd + "'\n" ;
			if (cmd == 'dump') {
				output += "Chains: " + this.chains.length + "\n" ;
				for (ch=0; ch<this.chains.length; ch++) {
					output += "CHAIN - ID: " + this.chains[ch].id + "\n";
					for (k=0; k<this.chains[ch].properties.length; k++) {
						output += "  " + this.chains[ch].properties[k].key ;
						output += " = " + this.chains[ch].properties[k].value + "\n" ;
					}
				}
			} else if (cmd == 'debug') {
				if (value != '') {
					if (value == 'true') {
						this.debug = true ;
						output += "Debug turned on" ;
					} else {
						this.debug = false ;
						output += "Debug turned off" ;
					}
				} else {
					output += "ERROR: No value set" ;
				}
			} else if (id != '' && key != '') {
				var chain = null ;
				for (i=0; i<this.chains.length; i++) {
					if (this.debug) output += "DEBUG: Checking " + this.chains[i].id + " == " + id + "\n" ;
					if (this.chains[i].id == id) chain = this.chains[i] ;
				}
				if (cmd == 'set') {
					if (value != '') {
						if (chain == null) {
							if (this.debug) output += "DEBUG: Creating new chain\n" ;
							chain = new PropertyChain() ;
							chain.id = id ;
							this.chains.push(chain) ;
						}
						var pv = new PropertyValue() ;
						pv.key = key ;
						pv.value = value ;
						chain.setPropertyValue(pv) ;
						output += 'Key "' + key + '" set to "' + value + '"\n' ;
					} else {
						output += 'ERROR: No value set\n' ;
					}
				} else if (cmd == 'get') {
					if (chain == null) {
						output += "ERROR: Key '" + key + "' not found" ;
					} else {
						var pv = chain.getPropertyValue(key);
						if (pv == null) {
							output += 'Key "' + key + '" not found\n' ;
						} else {
							output += 'KEY: ' + pv.key + ', VALUE: ' + pv.value + '\n' ;
						}
					}
				}
			} else {
				//error - missing parameter
				output += "ERROR: missing parameter\n" ;
			}
		}
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write(output);
		res.end();
	
	}
}

var server = new PropertyChainServer() ;
	
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
	} else if (uri.startsWith('/properties')) {
		server.processRequest(req, res) ;
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