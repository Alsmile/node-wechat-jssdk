#node-wechat-jssdk
使用nodejs开发微信jssdk的小工具，目前主要实现微信jssdk的签名，默认使用内存作为缓存，可以通过配置使用redis作为缓存。  


#依赖环境
request： 网络请求  
crypto： 加密  
redis： 微信签名缓存  

#配置
根据微信要求，需要使用域名，并且在微信公众号设置授权，并且为80端口  
本地开发可以配置host，映射一个域名到本地。  

##配置选项
 ```
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
 ```  
其中，redis可选。没有redis时采用内存存储


#运行环境
微信pc端或者下载 [微信web开发者工具](http://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1455784140&token=&lang=zh_CN)   

#运行demo
执行npm install安装必要依赖环境后，直接运行 node server 即可运行demo 。  

#使用：  
参考demo文件夹。（运行demo需要先将demo下的config/config_demo.js重命名为config.js,按照格式要求配置相关选项）  

 ``` 
npm install node-wechat-jssdk   
var wechatJssdk = require('node-wechat-jssdk');    
wechatJssdk.init(config);   
// your code
 ```

下面代码，摘自demo
 ```
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
 ```

当配置文件config.js中添加了redis配置时，采用redis缓存，否则采用内存缓存。 
 
