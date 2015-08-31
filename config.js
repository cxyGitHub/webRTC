/**
 * Created by chenxiangye on 2015/8/27.
 */
var app = {
    email:'742823701@qq.com',
    appport: 3000,
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'root',
    database: 'webRTC',
    logger_path: "./bin/logs/error.log",
    logger_level: 'debug' //debug | error
};
module.exports = app;


global.Sys =new function(){
    this.cont= {
        siteName: "迅视"
    }
}