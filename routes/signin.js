var express = require('express');
var router = express.Router();
var crypto=require("crypto");


//登录界面
router.get('/login', function(req, res) {
    res.render('login', { message: false});
});

//登录界面
router.post('/login', function(req, res) {
    console.log("登录");
    var User=DB.get("User");
    var p=req.body;
    var userHash = crypto.createHash('sha1');
    userHash.update(p.password);
    p.password=userHash.digest('hex');
    var password = p.password;
    delete p["password"];
    User.query(p,function(err,result){
        if(err){
      //      next(err);
            console.log("err:"+err);
        }else{
            if(result && result.length>0){
                req.session.user=result[0];
               if(result[0].user_password==password) {
                   var ip_ = getClientIp(req);
                   var params = {lastlogintime: new Date(), lastloginip: ip_};//更新登录时间
                   var condition = {user_id: result[0].user_id};//条件
                    User.update(params,condition);
                   console.log("成功");
               }else{
                   res.render('signin',{message:'用户名或密码错误'});
               }
            }else{
                res.render('signin',{message:'用户名或密码错误'});
            }
        }
    });
});

function getClientIp(req) {
    return req.connection.remoteAddress ||req.headers['x-forwarded-for'] || req.headers['x-real-ip'] ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
};



module.exports = router;

