/**
 * Created by chenxiangye on 2015/9/1.
 */
$(function(){
    var ul = $("#friend_box ul");
    var html = "";
    for(var i in friends){
        var f = friends[i];
        html+="<li id='f_"+f.user_id+"'>"+ f.user_name+"&nbsp;&nbsp;("+ f.email+")</li>"
    }
    ul.append(html);

    $("#friends").click(function(){
        $("#friend_box").css({left:"0px"});
        $("#mask").show();
    });

    $("#mask").click(function(){
        $("#friend_box").css({left:"-200px"});
        $("#mask").hide();
    });


    $("#friend_box ul").delegate('li','click',function() {
        var friend_id = $(this).attr("id").replace("f_", "");
        webRTC.socket.emit('message', {
            "eventName": "__jion",
            "data": {"id": friend_id}});
    });
});