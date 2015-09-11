/**
 * Created by chenxiangye on 2015/8/31.
 */
var socket_io = require('socket.io');
var UUID = require('node-uuid');
var events = require('events');
var util = require('util');
var errorCb = function(rtc) {
    return function(error) {
        if (error) {
          console.log(error);
        }
    };
};

function webRTC(){
    this.sockets = {};//用来存储所有用户的socket
    var that = this;


    this.on('__conn', function(data, socket) {
        socket.id = data.id;//给当前的soket设置一个唯一的id
        that.sockets[data.id]=socket;
    });

    this.on("__jion",function(data, socket){
       var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_jion', {
                "data": {"id": socket.id}
            });
        }
    });

    this.on("__agree",function(data, socket){
       var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_agree', {
                "data": {"id": socket.id,"media":data.media}
            });
        }
    });

    this.on("__offerForOther",function(data, socket){
        var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_offerForOther', {
                "data": {"id": socket.id}
            });
        }
    })

    this.on("__refuse",function(data, socket){
        var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_refuse', {
                "data": {"id": socket.id}
            });
        }
    });

    this.on('__offer', function(data, socket) {
        console.log("__offer");
        var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_offer', {
                "data": {
                    "sdp": data.sdp,
                    "id": socket.id
                }
            });
        }
    });


    this.on('__answer', function(data, socket) {
        console.log("__answer");
        var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_answer', {
                "data": {
                    "sdp": data.sdp,
                    "id": socket.id
                }
            });
        }
    });


    this.on('__ice_candidate', function(data, socket) {
        console.log("__ice_candidate");
        var f_socket = that.sockets[data.id];
        if (f_socket) {
            f_socket.emit('_ice_candidate', {
                "data": {
                    "label": data.label,
                    "candidate": data.candidate,
                    "id": socket.id
                }
            });
        }
    });


}

//webRTC 继承 事件处理器 用来处理事件,及回调
util.inherits(webRTC, events.EventEmitter);

webRTC.prototype.init = function(socket) {
    var that = this;
    //为socket绑定事件处理器用来派发接收到的事件命令
    socket.on('message', function(json) {
        console.log("message:"+JSON.stringify(json));
        if (json.eventName) {
            that.emit(json.eventName, json.data, socket);
        } else {
            console.log("命令为空，你想要做什么？");
        }
    });

    //连接关闭后从webRTC实例中移除连接，并通知其他连接
    socket.on('disconnect', function(){
         console.log("关闭socket-"+socket.id);
        delete that.sockets[socket.id];
    });
}
/**
 * 添加socket
 * @param socket
 */
webRTC.prototype.addSocket = function(socket) {
    this.sockets.push(socket);
}
/**
 * 根据id获取用户socket
 * @param id
 * @returns {*}
 */
webRTC.prototype.getSocket = function(id) {
    var i,curSocket;
    if (!this.sockets) {
        return;
    }
    for (i = this.sockets.length; i--;) {
        curSocket = this.sockets[i];
        if (id === curSocket.id) {
            return curSocket;
        }
    }
    return;
};
/**
 * 删除socket
 * @param socket
 */
webRTC.prototype.delSocket = function(socket) {
    if (!this.sockets) {
        return;
    }
    this.sockets.remove(socket);
}

/**
 * 删除数组中指定值
 * @param val
 * @returns {number}
 */
Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
};
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    if (index > -1) {
        this.splice(index, 1);
    }
};

module.exports.create = function(server){
    var webRTCServer = new webRTC();
    socket_io = socket_io.listen(server);
    errorCb = errorCb(webRTCServer);
    socket_io.on('connection', function(socket) {
        console.log("socket创建成功");
        webRTCServer.init(socket);
    });
    return webRTCServer;
}
