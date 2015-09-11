/**
 * Created by chenxiangye on 2015/8/31.
 */
var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection || window.mozRTCPeerConnection); //对等链接
var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless
var moz = !!navigator.mozGetUserMedia;

var iceServer = {
    "iceServers": [{
        "url": "stun:stun.l.google.com:19302"
    }]
};

function webRTC(){
    //本地WebSocket连接
    this.socket = null;
    this.peerConnections = {};
    this.localMediaStream = null;
    this.dataChannels = {};

}






/*************************流和服务器建立连接部分*******************************/
webRTC.prototype.connect = function(id) {
    var socket,
        that = this,
        room = room || "";
    socket = this.socket = io.connect();

    socket.on('connect', function () {
        console.log("创建socket成功");
        socket.emit('message', {
            "eventName": "__conn",
            "data": {"id": id}
        });
    });

    socket.on("_jion",function(json){
        var friend_id = json.data.id;
        that.localMediaStream = null;
        if(confirm($("#f_"+friend_id).html()+"邀请视频。")){
            that.createStream(function(){
                var pc = that.createPeerConnection(friend_id);
                try {
                    pc.addStream(that.localMediaStream);
                }catch(e){console.log(e);}
                socket.emit('message', {
                    "eventName": "__agree",
                    "data": {"id": friend_id,"media":that.localMediaStream}
                });
            });
        }else{
            socket.emit('message', {
                "eventName": "__refuse",
                "data": {"id": friend_id}
            });
        }
    });

    socket.on("_agree",function(json){
        var friend_id = json.data.id;
        that.createStream(function(){
            var pc = that.createPeerConnection(friend_id);
            try {
                pc.addStream(that.localMediaStream);
            }catch(e){alert(e);}
            if(that.localMediaStream==null) {
                socket.emit('message', {
                    "eventName": "__offerForOther",
                    "data": {"id": friend_id}
                });
            }else{
                that.createDataChannel(pc,friend_id);
                that.sendOffers(friend_id);
            }
        });
    });


    socket.on('_offerForOther', function(json) {
        var friend_id = json.data.id;
        var pc = that.peerConnections[friend_id];
        that.createDataChannel(pc,friend_id);
        that.sendOffers(friend_id);
    });


    socket.on('_refuse', function(json) {
        alert("拒绝");
    });


    socket.on('_offer', function(json) {
        that.sendAnswer(json.data.id, json.data.sdp);
    });

    socket.on('_answer', function(json) {
        that.receiveAnswer(json.data.id, json.data.sdp);
    });

    socket.on("_ice_candidate", function(json) {
        var candidate = new nativeRTCIceCandidate(json.data);
        var pc = that.peerConnections[json.data.id];
        pc.addIceCandidate(candidate);
    });

}


//消息广播
webRTC.prototype.broadcast = function(message) {
    for (var i  in this.dataChannels) {
        this.sendMessage(message, i);
    }
};

//发送消息方法
webRTC.prototype.sendMessage = function(message, friend_id) {
    if (this.dataChannels[friend_id].readyState.toLowerCase() === 'open') {
        this.dataChannels[friend_id].send(JSON.stringify({
            type: "__msg",
            data: message
        }));
    }
};


//创建datachannel
webRTC.prototype.createDataChannel = function(pc,friend_id){
    var that = this;
    var channel = null;
    try {
        channel = pc.createDataChannel(0);
        this.addDataChannel(friend_id, channel);
    }catch(e){console.log(e);}
}

webRTC.prototype.addDataChannel = function(friend_id, channel) {
    var that = this;
    try {
        channel.onopen = function() {
            console.log('data_channel_opened');
        };

        channel.onclose = function(event) {
            delete that.dataChannels[friend_id];
            console.log('data_channel_closed'+ friend_id);
        };

        channel.onmessage = function(message) {
            var json;
            json = JSON.parse(message.data);
            if (json.type === '__file') {
                /*that.receiveFileChunk(json);*/
                that.parseFilePacket(json, socketId);
            } else {
                console.log(json);
                console.log('data_channel_message-'+friend_id+": "+ json.data);
            }
        };

        channel.onerror = function(err) {
            console.log('data_channel_error-'+friend_id+": "+  err);
        };
        this.dataChannels[friend_id] = channel;
    } catch (e) {
        console.log(e);
    }
}



//关闭
webRTC.prototype.closePeerConnection = function(){
    for(var i in this.peerConnections){
        var pc = this.peerConnections[i];
        try{
            console.log("close:"+pc);
            pc.close();
        }catch(e){console.log(e);}
    }
}

webRTC.prototype.receiveAnswer = function(friend_id, sdp) {
    var pc = this.peerConnections[friend_id];
    pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
    console.log("握手成功");
};

webRTC.prototype.sendAnswer = function(friend_id, sdp) {
    var pc = this.peerConnections[friend_id];
    var that = this;
    pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
    pc.createAnswer(function(session_desc) {
        pc.setLocalDescription(session_desc);
        that.socket.emit('message', {
            "eventName": "__answer",
            "data": {
                "sdp": session_desc,
                "id": friend_id
            }
        });
    }, function(error) {
        console.log(error);
    });
}


webRTC.prototype.sendOffers = function(friend_id) {
    var i, m,
        pc,
        that = this,
        pcCreateOfferCbGen = function(pc, socketId) {
            return function(session_desc) {
                pc.setLocalDescription(session_desc);
                that.socket.emit('message', {
                    "eventName": "__offer",
                    "data": {
                        "sdp": session_desc,
                        "id": friend_id
                    }
                });
            };
        },
        pcCreateOfferErrorCb = function(error) {
            console.log(error);
        };
        pc = this.peerConnections[friend_id];
        pc.createOffer(pcCreateOfferCbGen(pc, friend_id), pcCreateOfferErrorCb);
};



webRTC.prototype.createPeerConnection = function(friend_id) {
    var that = this;
    var pc = new PeerConnection(iceServer);
    this.peerConnections[friend_id] = pc;
    pc.onicecandidate = function(evt) {
        if (evt.candidate){
            that.socket.emit('message', {
                "eventName": "__ice_candidate",
                "data": {
                    "label": evt.candidate.sdpMLineIndex,
                    "candidate": evt.candidate.candidate,
                    "id": friend_id
                }
            });
        }
    };

    pc.onopen = function() {
       console.log("onopen");
    };

    pc.onclose = function() {
        console.log("pcclose");
    };
    pc.onaddstream = function(evt) {
        var element = document.getElementById("other");
        if (navigator.mozGetUserMedia) {
            element.mozSrcObject =  evt.stream;
            element.play();
        } else {
            element.src = webkitURL.createObjectURL( evt.stream);
        }
        element.src = webkitURL.createObjectURL( evt.stream);
    };

    pc.ondatachannel = function(evt) {
        console.log("ondatachannel");
        that.addDataChannel(friend_id, evt.channel);
    };
    return pc;
}


webRTC.prototype.createStream = function(fun){
    var that = this;
    var options = {
        "video": true,
        "audio": false
    }
    if (getUserMedia) {
        getUserMedia.call(navigator, options, function(stream) {
                that.localMediaStream = stream;
                document.getElementById('video_self').src = URL.createObjectURL(stream);
                document.getElementById('video_self').play();
                fun();
            },
            function(error) {
                console.log("创建视频流失败！");
                fun();
            });
    } else {
        console.log("浏览器不支持视频流创建");
    }
}



























