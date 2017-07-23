var ballTrail = [];

function setup() {

  frameRate(60);
  createCanvas(window.innerWidth, window.innerHeight);
  // background(153);

}

function draw() {

  background(240,240,240);

  c5 = color('#DB5149');
  noStroke();
  fill(0,0,0,10);
  var offset = window.innerWidth*0.15;
  ellipse(-offset, window.innerHeight/2, window.innerHeight*0.8, window.innerHeight*0.8);
  ellipse(window.innerWidth+offset, window.innerHeight/2, window.innerHeight*0.8, window.innerHeight*0.8);

  // var r = window.innerHeight*0.4;
  // var h = r - offset
  // var a = 2 * Math.sqrt( h * ( 2 * r - h ) ) ;

  c = color('#2198d6');
  noStroke();
  fill(c);

  // updateCollision();

  for(var i = 0; i<playerList.length; i++) {
    unMappedX = map(playerList[i].x, 0, 1, 0, window.innerWidth);
    unMappedY = map(playerList[i].y, 0, 1, 0, window.innerHeight);

    stroke(c);
    strokeWeight(2);
    noFill();

    ballRadius = window.innerWidth*0.05;

    ellipse(unMappedX, unMappedY, ballRadius, ballRadius);

    c2 = color('#a6a6a6');
    fill(c2);
    noStroke();
    textAlign(CENTER);
    textSize(ballRadius/3);
    text(playerList[i].name[0], unMappedX, unMappedY+ballRadius/8);
  }

  move = {
    hor: 0,
    ver: 0
  };

  if(keyIsDown(LEFT_ARROW)) {
    move.hor = -1;
  }

  if(keyIsDown(RIGHT_ARROW)) {
    move.hor = 1;
  }

  if(keyIsDown(UP_ARROW)) {
    move.ver = -1;
  }

  if(keyIsDown(DOWN_ARROW)) {
    move.ver = 1;
  }

  // velocity.x *=0.95;
  // velocity.y *= 0.95;
  socket.emit('playerMovement', move);

  // mappedX = map(mouseX, 0, window.innerWidth, 0, 1);
  // mappedY = map(mouseY, 0, window.innerHeight, 0, 1 );

  // socket.emit('mousePosition', { coords: {mouseX:mappedX, mouseY:mappedY} });

  updateBall();

  if(cpAnimation) {
    updateCollisionAnimation();
  }

}

  var ani = 0;

function updateBall() {

  unMappedBallX = map(ballPosition.x, 0, 1, 0, window.innerWidth);
  unMappedBallY = map(ballPosition.y, 0, 1, 0, window.innerHeight);

  trail(unMappedBallX, unMappedBallY);

  ballRadius = window.innerWidth*0.03;

  c3 = color('#278BC1');
  noStroke();

  ballBackX = map(ballPosition.x, 0, 1, window.innerWidth*0.0025, -window.innerWidth*0.0025);
  ballBackY = map(ballPosition.y, 0, 1, window.innerWidth*0.0025, -window.innerWidth*0.0025);

  fill(c3);
  ellipse(unMappedBallX+ballBackX, unMappedBallY+ballBackY, ballRadius, ballRadius);

  fill(c);
  ellipse(unMappedBallX, unMappedBallY, ballRadius, ballRadius);

}

function trail(x, y) {
  if(ballTrail.length>20) {
    ballTrail.shift();
  }

  ballTrail.push([x,y]);

  for(var i=0;i<ballTrail.length;i++) {
    fill(33,152,214,i);
    // fill(255,255,255,i*10);
    noStroke();
    ellipse(ballTrail[i][0], ballTrail[i][1], i*2, i*2);
  }


}

function updateCollisionAnimation() {
  if(ani < 50) {
    ani += 5;

    unMappedCpX = map(cp.x, 0, 1, 0, window.innerWidth);
    unMappedCpY = map(cp.y, 0, 1, 0, window.innerHeight);

    opacity = map(ani, 0, 50, 1, 0);

    c4 = color('#ffffff');
    stroke(c4, opacity);
    strokeWeight(50-ani);
    noFill();
    ellipse(unMappedCpX, unMappedCpY, ani*window.innerWidth*0.0015, ani*window.innerWidth*0.0015);

  } else {
    cpAnimation = false;
    ani = 0;
  }

}
