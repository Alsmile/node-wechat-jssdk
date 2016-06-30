var express = require('express');
var router = express.Router();
var config = require('../config/config');
var wechatJssdk = require('../../index');
wechatJssdk.init(config.wechatJssdk);

module.exports = function (app) {
  app.use(['/api'], router);
};

router.get('/wechat/config',wechatJssdk.getJssdkConfigByAjax, function (req, res, next) {
  var data = res.locals.wechat;
  if (data) {
    res.send(data);
  } else {
    res.send({
      code: {
        errcode: 1,
        errmsg: '获取数据失败'
      }
    });
  }
});
