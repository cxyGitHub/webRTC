/**
 * Created by chenxiangye on 2015/8/31.
 */
var express = require('express');
var router = express.Router();

//��¼����
router.get('/index', function(req, res) {
    res.render('index', { message: false});
});


module.exports = router;