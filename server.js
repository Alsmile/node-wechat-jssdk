var express = require('express');
var app = express();
var config = require('./demo/config/config');
require('./demo/express')(app, config);
var server = app.listen(config.port, function() {
    console.log('Express server listening on port ' + config.port);
});
