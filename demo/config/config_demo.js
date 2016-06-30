var config =  {
    port: 80,  // 微信域名要求80端口
    wechatJssdk: {
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
    }
};

module.exports = config;
