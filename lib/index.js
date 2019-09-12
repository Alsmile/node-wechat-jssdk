'use strict';
/**************** 注意： 微信要求 必须是  80 端口  ***************/

var request = require('request');
var crypto = require('crypto');
var redis = require('redis');

var config = {
  wechat: {
    appid: '',
    secret: ''
  },
  redis: {
    port: 6379,
    host: '',
    pass: '',
    prefix: 'wechat.jssdk'
  }
};

// 定义一个默认缓存对象
var cache = {
  data:{},
  dataTime: {},
  dataExpire: {},
  get: function (key, callback) {
    if (!callback) return;
    if (!this.dataExpire[key]) return callback(this.data[key]);

    if (this.dataExpire[key]*1000+ this.dataTime[key] < new Date().getTime()/1000) {
      this.data[key] = null;
      callback(null, null);
    } else {
      callback(null, this.data[key]);
    }
  },
  set: function(key, val, callback){
    this.data[key] = val;
    this.dataTime[key] = new Date().getTime();
    if (callback) callback(null, val);
  },
  expire: function(key, val, callback){
    this.dataExpire[key] = val;
    if (callback) callback(null, val);
  }
};

// 定义jssdk对象
var jssdk = {
  urls: {
    token: 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential',
    ticket: 'https://api.weixin.qq.com/cgi-bin/ticket/getticket'
  },
  init: function (option) {
    if (!option) return false;

    config = option;
    if (config.redis) {
      cache = redis.createClient(config.redis);
      cache.auth(config.redis.pass, function () {});
      cache.on("error", function (err) {
        console.error(err);
      });
    }

    return true;
  },
  getHost: function (req) {
    return req.protocol + '://' + req.hostname;
  },
  createNonceStr: function () {
    return Math.random().toString(36).substr(2, 15);
  },
  createTimestamp: function () {
    return parseInt(new Date().getTime() / 1000);
  },
  raw: function (args) {
    var keys = Object.keys(args).sort(), newArgs = [];
    keys.forEach(function (key) {
      newArgs.push([key.toLowerCase(), args[key]].join('='));
    });
    return newArgs.join('&');
  },
  getAccessToken: function (callback) {
    // 先读取缓存
    cache.get('token' + config.wechat.appid, function (err, reply) {
      // 存在缓存，直接返回
      if (reply && reply != 'undefined') return callback(null, reply);

      // 不存在缓存，从微信api获取
      var url = jssdk.urls.token + "&appid=" + config.wechat.appid + "&secret=" + config.wechat.secret;
      request.get(url, function (error, response, body) {
        if (error) {
          return callback(error);
        }
        var data = JSON.parse(body);
        var accessToken = data['access_token'];
        cache.set('token' + config.wechat.appid, accessToken, function (err, reply) {
          cache.expire('token' + config.wechat.appid, data['expires_in'] - 30);
          callback(null, accessToken);
        });
      });
    });
  },
  getJsApiTicket: function (callback) {
    // for dev
    // cache.expire('token' + config.wechat.appid, 0);
    // cache.expire('ticket' + config.wechat.appid, 0);
    // end

    // 先读取缓存
    cache.get('ticket' + config.wechat.appid, function (err, reply) {
      // 存在缓存，直接返回
      if (reply && reply != 'undefined') return callback(null, reply);

      // 不存在缓存，从微信api获取
      jssdk.getAccessToken(function (err, accessToken) {
        var url = jssdk.urls.ticket + '?access_token=' + accessToken + '&type=jsapi';
        request.get(url, function (error, response, body) {
          if (error) {
            return callback(error);
          }
          var data = JSON.parse(body);
          var jsApiTicket = data['ticket'];
          cache.set('ticket' + config.wechat.appid, jsApiTicket, function (err, reply) {
            cache.expire('ticket' + config.wechat.appid, data['expires_in'] - 30);
            callback(null, jsApiTicket);
          });
        });
      });
    });
  },
  createSha1Sign: function (jsApiTicket, url) {
    var data = {
      jsapi_ticket: jsApiTicket,
      nonceStr: jssdk.createNonceStr(),
      timestamp: jssdk.createTimestamp(),
      url: url
    };
    var str = jssdk.raw(data);
    var sha1 = crypto.createHash('sha1');
    sha1.update(str);
    data.signature = sha1.digest('hex');
    data.appId = config.wechat.appid;
    delete data.jsapi_ticket;
    delete data.url;
    return data;
  },
  getJssdkConfig: function (req, res, next) {
    jssdk.getJsApiTicket(function (err, ticket) {
      if (err) {
        res.locals.wechat = {};
      }
      res.locals.wechat = jssdk.createSha1Sign(ticket, jssdk.getHost(req) + req.originalUrl);
      next();
    });
  },
  getJssdkConfigByAjax: function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    jssdk.getJsApiTicket(function (err, ticket) {
      if (err) {
        res.locals.wechat = null;
      }
      res.locals.wechat = jssdk.createSha1Sign(ticket, req.headers.referer);
      next();
    });
  }
};

module.exports = jssdk;
