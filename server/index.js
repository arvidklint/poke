var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(3000);

var lastPlayerID = 0;
var rooms = [];

var ball = {
  position: {
    x: Math.random(),
    y: Math.random()
  },
  velocity: {
    x: Math.random() / 1000,
    y: Math.random() / 1000
  },
  mass: 0.3,
  id: 'ball'
};

io.on('connection', function (socket) {
  console.log("new connection");

  socket.on('join', function(data) {
    console.log("new player joined: " + data.name);
    // socket.join(data.room);

    socket.player = {
      id: lastPlayerID++,
      name: data.name,
      position: {
        x: 0.5,
        y: 0.5
      },
      velocity: {
        x: 0,
        y: 0
      },
      direction: {
        hor: 0,
        ver: 0
      },
      isColliding: false,
      power: 100,
      acceleration: 0.0005,
      speed: 0,
      mass: 1
    };

    socket.emit('allPlayers', getAllPlayers());
    socket.broadcast.emit('newPlayer', socket.player);

    socket.on('playerMovement', function(data) {
      socket.player.direction = data;
      // console.log("mouse position: " + data.coords.mouseX + ", " + data.coords.mouseY);
    });

    socket.on('disconnect',function(){
      console.log('Disconnected: ' + socket.player.name);
      io.emit('remove',socket.player.id);
    });
  });
});

setInterval( function() {
  // Update ball position
  ball.velocity.x *= 0.99;
  ball.velocity.y *= 0.99;
  ball.position.x += ball.velocity.x;
  ball.position.y += ball.velocity.y;
  // Update player position
  var players = getAllPlayers();
  for(var player of players) {
    player.velocity.x += player.direction.hor * player.acceleration;
    player.velocity.y += player.direction.ver * player.acceleration;
    player.velocity.x *= 0.95;
    player.velocity.y *= 0.95;
    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;
    io.emit('movePlayer', player);
  }
  bounceBorders(ball);
  for(var player of players) {
    bounceBorders(player);
  }
  checkBallCollision();
  io.emit('moveBall', ball.position);
}, 1000/60);

function getAllPlayers(){
  var players = [];
  Object.keys(io.sockets.connected).forEach(function(socketID){
    var player = io.sockets.connected[socketID].player;
    if(player) players.push(player);
  });
  return players;
}

function bounceBorders(data) {
  if(data.position.x < 0) {
    data.position.x = 0;
    if(data.position.y > 0.2 && data.position.y < 0.8 && data.id === 'ball') {
      goal('left');
    } else {
      data.velocity.x *= -1;
      io.emit('collision', {
        type: 'wall'
      });
    }
  } else if(data.position.x > 1) {
    data.position.x = 1;
    if(data.position.y > 0.2 && data.position.y < 0.8 && data.id === 'ball') {
      goal('right');
    } else {
      data.velocity.x *= -1;
      io.emit('collision', {
        type: 'wall'
      });
    }
  }
  if(data.position.y < 0) {
    data.position.y = 0;
    data.velocity.y *= -1;
    io.emit('collision', {
      type: 'wall'
    });
  } else if (data.position.y > 1) {
    data.position.y = 1;
    data.velocity.y *= -1;
    io.emit('collision', {
      type: 'wall'
    });
  }
}

function goal(side) {
  io.emit('goal', side);
  ball.position = {
    x: 0.5,
    y: 0.5
  };
  ball.velocity = {
    x: 0,
    y: 0
  };
}

function checkBallCollision() {
  var playerList = getAllPlayers();
  for(var player of playerList) {
    var distance = Math.sqrt(Math.pow(player.position.x - ball.position.x, 2) + Math.pow(player.position.y - ball.position.y, 2));
    if(distance < 0.04 && !player.isColliding) {
      var pp = player.position;
      var pv = player.velocity;
      var bp = ball.position;
      var bv = ball.velocity;

      var cp = {
        x: ((pp.x * 0.05) + (bp.x * 0.03)) / (0.03 + 0.05),
        y: ((pp.y * 0.05) + (bp.y * 0.03)) / (0.03 + 0.05)
      };

      var newPlayerVel = {
        x: (pv.x * (player.mass - ball.mass) + (2 * ball.mass * bv.x)) / (player.mass + ball.mass),
        y: (pv.y * (player.mass - ball.mass) + (2 * ball.mass * bv.y)) / (player.mass + ball.mass)
      };

      var newBallVel = {
        x: (bv.x * (ball.mass - player.mass) + (2 * player.mass * pv.x)) / (player.mass + ball.mass),
        y: (bv.y * (ball.mass - player.mass) + (2 * player.mass * pv.y)) / (player.mass + ball.mass)
      };

      player.position.x = player.position.x + newPlayerVel.x;
      player.position.y = player.position.y + newPlayerVel.y;
      ball.position.x = ball.position.x + newBallVel.x;
      ball.position.y = ball.position.y + newBallVel.y;

      player.velocity = newPlayerVel;
      ball.velocity = newBallVel;

      // var v = {
      //   x: ball.position.x - player.position.x,
      //   y: ball.position.y - player.position.y
      // };
      // n = getNormalized(v);
      // var dot = n.x * ball.velocity.x + n.y * ball.velocity.y;
      // var ref = {
      //   x: ball.velocity.x - 2 * dot * n.x,
      //   y: ball.velocity.y - 2 * dot * n.y
      // };
      //
      // ball.velocity.x = ref.x;
      // ball.velocity.y = ref.y;
      // // console.log("Abs: " + abs);
      // console.log("n: " + n.x + ", " + n.y);
      // console.log("dot: " + dot);
      // console.log("Ref: " + ref.x + ", " + ref.y);

      player.isColliding = true;
      io.emit('collision', {
        type: 'ball',
        cp: cp
      });
    } else if(distance >= 0.04) {
      player.isColliding = false;
    }
  }
}

function getNormalized(vector) {
  var hypo = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
  return {
    x: vector.x / hypo,
    y: vector.y / hypo
  };
}
