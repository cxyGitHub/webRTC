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
        if(confirm($("#f_"+friend_id).html()+"邀请视频。")){
            that.createStream(function(){
                var pc = that.createPeerConnection(friend_id);
                try {
                    pc.addStream(that.localMediaStream);
                }catch(e){alert(e);}
                socket.emit('message', {
                    "eventName": "__agree",
                    "data": {"id": friend_id}
                });
              //  that.sendOffers(friend_id);
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
            that.sendOffers(friend_id);
        });
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
       alert("onopen");
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
        alert("ondatachannel");
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



























