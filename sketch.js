function setup() {
  createCanvas(windowWidth, windowHeight);

  xCurve = new AnimationCurve([
    createVector(0, 0),
    createVector(0.5, 1),
    createVector(0.95, 1.7),
    createVector(1, 1),
  ]);
  yCurve = new AnimationCurve([
    createVector(0, 0),
    createVector(0.1, 1.75),
    createVector(0.9, 1.25),
    createVector(1, 1),
  ]);
  yCurve2 = new AnimationCurve([
    createVector(0, 0),
    createVector(0.1, 0.75),
    createVector(0.9, 0.75),
    createVector(1, 1),
  ]);
}
var gameTime = 0;
var nextMeteorTime = 0;
var meteorInterval = 7.5;

var aimingAngle = -Math.PI / 2;
var score = 0;

function draw() {
  gameTime += deltaTime / 1000;
  meteorInterval = max(1, meteorInterval * 0.95);

  // sky
  background("#fff");
  linearGradient(0, 0, 0, height, "#219ebc", "#8ecae6");
  rect(0, 0, width, height);

  // floor
  noStroke();
  linearGradient(0, height - 40, 0, height, "#adc178", "#588157");
  rect(0, height - 40, width, 40);

  if (gameTime > nextMeteorTime) {
    meteorInterval = max(1, meteorInterval - 0.1);
    nextMeteorTime = gameTime + meteorInterval;
    meteors.push(new FallingMeteor());
  }

  for (var i = particles.length - 1; i >= 0; i--) {
    var particle = particles[i];
    particle.draw();
    var dead = particle.move();
    if (dead) {
      particles.splice(i, 1);
    }
  }

  for (var i = meteors.length - 1; i >= 0; i--) {
    var meteor = meteors[i];
    meteor.draw();
    var reached = meteor.move();
    if (reached) {
      meteors.splice(i, 1);

      for (var j = 0; j < 1000; j++) {
        var particle = new Particle(random(width), random(height));
        particles.push(particle);
      }

      meteors = [];
      setTimeout(() => {
        alert("Game over!");
        location.reload();
      }, 1000);
    }
  }

  for (var i = missiles.length - 1; i >= 0; i--) {
    var missile = missiles[i];
    var reached = missile.move();
    if (frameCount % 3 == 0) {
      particles.push(new Particle(missile.x, missile.y));
    }
    missile.draw();

    if (reached) {
      for (var j = meteors.length - 1; j >= 0; j--) {
        var meteor = meteors[j];
        var d = dist(missile.x, missile.y, meteor.x, meteor.y);
        if (d < meteor.size / 2 + missile.size / 2) {
          meteors.splice(j, 1);
          score++;
        }
      }

      for (var j = 0; j < 20; j++) {
        var particle = new Particle(missile.x, missile.y);
        particles.push(particle);
      }
      missiles.splice(i, 1);
    }
  }

  // base
  stroke("#000");
  strokeWeight(1);
  fill("#023047");
  circle(width / 2, height, 100);
  var x = width / 2 + cos(aimingAngle) * 50;
  var y = height - 25 + sin(aimingAngle) * 50;
  strokeWeight(24)
  stroke("#000");
  line(width / 2, height - 25, x, y);
  strokeWeight(20)
  stroke("#023047");
  line(width / 2, height - 25, x, y);

  textAlign(CENTER, CENTER);
  textSize(isMobile() ? 20 : 32);
  fill(255);
  stroke(40);
  strokeWeight(3);

  if (gameTime <= 5) {
    text("Click anywhere to launch missiles", width / 2, height / 2);
  } else if (gameTime <= 10) {
    text("If a meteor reaches the ground, you lose!", width / 2, height / 2);
  }

  textSize(isMobile() ? 25 : 32);
  fill(255);
  stroke(40);
  strokeWeight(3);
  text("Score: " + score, width / 2, 50);
}

var missiles = []

function mousePressed() {
  var missile = new Missile(width / 2, height, mouseX, mouseY);
  aimingAngle = atan2(mouseY - height, mouseX - width / 2);
  // aimingAngle *= 180 / PI;
  missiles.push(missile);

  // muzzle particles
  for (var i = 0; i < 5; i++) {
    var x = width / 2 + cos(aimingAngle) * 70;
    var y = height - 25 + sin(aimingAngle) * 70;
    var particle = new Particle(x, y);
    particles.push(particle);
  }
}

var mId = 0;
class Missile {
  constructor(x, y, targetX, targetY) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.dist = dist(this.x, this.y, this.targetX, this.targetY);
    this.t = 0;
    this.xCurve = xCurve;
    this.yCurve = mId++ % 2 == 0 ? yCurve : yCurve2;
    this.path = [...Array(100)].map((_, i) => createVector(this.xCurve.getPoint(i / 100).y, this.yCurve.getPoint(i / 100).y));
    this.size = 15;
  }

  draw() {
    if (gameTime <= 10) {
      noFill();
      stroke("#fff");
      strokeWeight(2)
      for (var i = floor(lerp(0, this.path.length, this.t)); i < this.path.length; i++) {
        var p = this.path[i];
        var pBefore = this.path[i - 1];
        if (i % 2 == 1) {
          line(lerp(this.startX, this.targetX, pBefore.x), lerp(this.startY, this.targetY, pBefore.y), lerp(this.startX, this.targetX, p.x), lerp(this.startY, this.targetY, p.y));
        }
      }

      stroke("#023047");
      line(this.targetX - 5, this.targetY - 5, this.targetX + 5, this.targetY + 5);
      line(this.targetX - 5, this.targetY + 5, this.targetX + 5, this.targetY - 5);
    }


    stroke("#023047");
    fill("#023047");
    ellipse(this.x, this.y, this.size, this.size);
  }

  move() {
    this.t += deltaTime / 1000 / (this.dist / 500);
    if (this.t > 1) {
      return true;
    }
    var curveXP = this.xCurve.getPoint(this.t);
    var curveYP = this.yCurve.getPoint(this.t);
    this.x = lerp(this.startX, this.targetX, curveXP.y);
    this.y = lerp(this.startY, this.targetY, curveYP.y);

    return false;
  }
}

class AnimationCurve {
  constructor(points) {
    this.points = points;
    this.resolution = 100;
  }

  draw() {
    noFill();
    stroke(0);
    beginShape();
    for (var i = 0; i <= this.resolution; i++) {
      var t = i / this.resolution;
      var p = this.getPoint(t);
      vertex(p.x, p.y);
    }
    endShape();
  }

  getPoint(t) {
    var n = this.points.length - 1;
    var x = 0;
    var y = 0;

    for (var i = 0; i <= n; i++) {
      var p = this.points[i];
      var b = this.bernstein(n, i, t);
      x += p.x * b;
      y += p.y * b;
    }

    return createVector(x, y);
  }

  bernstein(n, i, t) {
    return this.combination(n, i) * pow(t, i) * pow(1 - t, n - i);
  }
  combination(n, i) {
    return this.factorial(n) / (this.factorial(i) * this.factorial(n - i));
  }
  factorial(n) {
    if (n == 0) {
      return 1;
    }
    return n * this.factorial(n - 1);
  }
}

var particles = []

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.life = random(0.5, 1);
  }

  draw() {
    noStroke();
    fill(255, this.life * 255);
    ellipse(this.x, this.y, this.life * 10, this.life * 10);
  }

  move() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= deltaTime / 1000;
    return this.life <= 0;
  }
}

class TrailParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 1;
  }

  draw() {
    noStroke();
    fill(255, this.life * 255);
    ellipse(this.x, this.y, this.life * 10, this.life * 10);
  }

  move() {
    this.life -= deltaTime / 1000;
    return this.life <= 0;
  }
}

var meteors = [];

class FallingMeteor {
  static speed = 0.1;
  constructor() {
    this.x = random(30, width - 30);
    this.y = 0;
    this.size = random(15, 30);
    FallingMeteor.speed += 0.01;
    this.speed = FallingMeteor.speed;
  }

  draw() {
    noStroke();
    radialGradient(this.x, this.y, 0, this.x, this.y, this.size / 2, "#e9c46a", "#f4a261");
    ellipse(this.x, this.y, this.size, this.size);

    if (frameCount % 20 == 0) {
      particles.push(new TrailParticle(this.x, this.y - this.size / 2));
    }
  }

  move() {
    this.y += this.speed;
    this.speed += 0.001;
    return this.y > height - 40;
  }
}

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function linearGradient(sX, sY, eX, eY, colorS, colorE) {
  let gradient = drawingContext.createLinearGradient(
    sX, sY, eX, eY
  );
  gradient.addColorStop(0, colorS);
  gradient.addColorStop(1, colorE);
  drawingContext.fillStyle = gradient;
  // drawingContext.strokeStyle = gradient;
}

function radialGradient(sX, sY, sR, eX, eY, eR, colorS, colorE) {
  let gradient = drawingContext.createRadialGradient(
    sX, sY, sR, eX, eY, eR
  );
  gradient.addColorStop(0, colorS);
  gradient.addColorStop(1, colorE);

  drawingContext.fillStyle = gradient;
}