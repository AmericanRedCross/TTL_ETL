/**
 *
 *socket.js sets up a socket connection that can be used to stream the details of the ETL to the client.
 *
 */


var socket = require('socket.io');

module.exports.listen = function(server){
  var io = socket.listen(server);

  io.on('connection', function(socket){
    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
    });
  });

  return io;
}