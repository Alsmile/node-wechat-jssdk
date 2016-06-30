var express = require('express'),
  router = express.Router();

module.exports = function (app) {
  app.use([ '/'], router);
};

router.get('/', function (req, res, next) {
  res.render('index', {
    title: '微信调用demo',
    url: '/'
  });
});

