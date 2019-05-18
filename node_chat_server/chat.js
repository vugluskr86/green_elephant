module.exports = function (http) {
  var io = require('socket.io')(http);
  var module = {};

  module.init = () => {
    io.on('connection', function(socket){
      socket.on('create', function(room) {
        socket.join(room);
        socket.on(room, function(msg){
          io.emit(room, {message: msg, room : room});
        });
      });
    });
  }

  return module;
};