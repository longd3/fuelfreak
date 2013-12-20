
var config = require('./config')
  , routes = require('./routes')
  , http = require('http')
  , _ = require('underscore')
  , express = require('express')
  , app = express();

config(app);

routes(app);

var port = process.env.PORT || 8080;
var server = http.createServer(app);
server.listen(port, function(){
  console.error('\x1b[32m' + app.set('domain') + '\x1b[0m running on port %d', port);
});
