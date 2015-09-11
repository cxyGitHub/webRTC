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
        var trans = "translate3d(200px,0,0)";
        $("#friend_box").css({transform:trans});
        $("#mask").show();
        setTimeout(function(){
            $("#mask").css({opacity:0.5});
        },100);


    });

    $("#mask").click(function(){
        var trans = "translate3d(0,0,0)";
        $("#friend_box").css({transform:trans});
        $("#mask").css({opacity:0});
        setTimeout(function(){
            $("#mask").hide();
        },500);


    });
    $("#chat_submit").click(function(){
          var  msg = $("#chat_input").val();
          webRTC.broadcast(msg);
    });

    $("#friend_box ul").delegate('li','click',function() {
        var friend_id = $(this).attr("id").replace("f_", "");
        webRTC.closePeerConnection();
        webRTC.socket.emit('message', {
            "eventName": "__jion",
            "data": {"id": friend_id}});
    });
});