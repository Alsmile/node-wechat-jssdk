var express = require('express');
var glob = require('glob');
var path = require('path');

module.exports = function (app, config) {
  app.use('/public', express.static(path.join(__dirname, 'public')));
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var controllers = glob.sync(__dirname + '/controllers/*.js');
  controllers.forEach(function (controller) {
    require(controller)(app);
  });
};
