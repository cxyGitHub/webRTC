/**
 * Created by chenxiangye on 2015/8/27.
 */
var express = require('express');
var favicon = require('serve-favicon');
var path = require('path');
var fs=require("fs");
var bodyParser = require('body-parser');//body 解剖器
var session=require("express-session");
global.logger=require("./utils/logger.js");
global.moment = require('moment');//日期函数全局访问
global.moment.locale('zh-cn');
global.DB=require("./utils/dbutil.js").Instance();


///定义实体
DB.define({key:'User',name:'t_user',fields:['user_id','user_name','user_password','create_date','email','role','lastloginip','lastlogintime']});
DB.define({key:'Friends',name:'t_friends',fields:['user1_id','user2_id']});





//Express配置
var app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('routes',__dirname + '/routes/');
app.use(favicon(__dirname+'/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'chenxy', cookie: { maxAge: 60000*30000 },saveUninitialized:true,resave:true}));





//Session拦截控制
app.all("*",function(req,res,next){
    console.log("Session拦截控制"+req.url);
    if(req.session.user){
        next();
    }else{
        req.url="/signin/login";
        next();
      /*  if(req.url!="/signin/login") {
            res.redirect("/signin/login");
        }else{
            next();
        }
        */
    }

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
