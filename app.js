/**
 * Created by chenxiangye on 2015/8/27.
 */
var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var fs=require("fs");
var bodyParser = require('body-parser');//body 解剖器
var session=require("express-session");
global.DB=require("./utils/dbutil.js").Instance();


///定义实体
DB.define({key:'User',name:'t_user',fields:['user_id','user_name','user_password','create_date','email','role','lastloginip','lastlogintime']});




//Express配置
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('routes',__dirname + '/routes/');
app.use(favicon(__dirname+'/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'chenxy', cookie: { maxAge: 60000*30 },saveUninitialized:true,resave:true}));

//Session拦截控制
app.all("*",function(req,res,next){
    console.log("Session拦截控制");
    next();
});

//控制层_根据routes文件名+方法_约定请求路径 (路由加载器)
var routes=app.get("routes");
fs.readdirSync(routes).forEach(function(fileName) {
    var filePath = routes + fileName;
    var rname=fileName.substr(0,fileName.lastIndexOf("."));
    if(!fs.lstatSync(filePath).isDirectory()) {
        app.use("/"+rname,require(filePath));
    }
});


module.exports = app;
