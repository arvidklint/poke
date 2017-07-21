var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

var lastPlayerID = 0;
var rooms = [];

io.on('connection', function (socket) {
  console.log("new connection");

  socket.on('join', function(data) {
    console.log("new player joined: " + data.name);
    socket.join(data.room);

    socket.player = {
      id: lastPlayerID++,
      name: data.name,
      x: 0,
      y: 0
    };

    socket.emit('allPlayers', getAllPlayers());
    socket.broadcast.to(data.room).emit('newPlayer', socket.player);

    socket.on('mousePosition', function(data) {
      // console.log("mouse position: " + data.coords.mouseX + ", " + data.coords.mouseY);
      socket.player.x = data.coords.mouseX;
      socket.player.y = data.coords.mouseY;
      io.emit('movePlayer', socket.player);
    });

    socket.on('disconnect',function(){
      console.log('Disconnected: ' + socket.player.name);
      io.emit('remove',socket.player.id);
    });
  });
});

function getAllPlayers(){
  var players = [];
  Object.keys(io.sockets.connected).forEach(function(socketID){
    var player = io.sockets.connected[socketID].player;
    if(player) players.push(player);
  });
  return players;
}
