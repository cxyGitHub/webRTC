/**
 * Created by chenxiangye on 2015/8/31.
 */
var express = require('express');
var router = express.Router();
var async=require("async");
//µÇÂ¼½çÃæ
router.get('/index', function(req, res) {
    var User=DB.get("Friends");
    var data = {};
    data.userInfo = JSON.stringify(req.session.user);
    User.querySql("select user_name,user_id,email,online from t_user where user_id in (select user2_id from t_friends where user1_id="+req.session.user.user_id+")",function(err,result){
        data.friends=JSON.stringify(result);
        if(err){
            console.log(err);
        }else {
            res.render('index', data);
        }
    });
});




module.exports = router;