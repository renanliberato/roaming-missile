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

function draw() {
  background("#8ecae6");

  textAlign(CENTER, CENTER);
  textSize(isMobile() ? 20 : 32);
  fill(255);
  stroke(40);
  strokeWeight(3);
  text("Click anywhere to launch missiles", width / 2, 40);

  for (var i = missiles.length - 1; i >= 0; i--) {
    var missile = missiles[i];
    var reached = missile.move();
    missile.draw();

    if (reached) {
      missiles.splice(i, 1);
    }
  }

  stroke(255);
  fill("#023047");
  circle(0, height, 100);
}

var missiles = []

function mousePressed() {
  var missile = new Missile(0, windowHeight, mouseX, mouseY);
  missiles.push(missile);
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
  }

  draw() {
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
    fill("#023047");
    ellipse(this.x, this.y, 15, 15);

    stroke("#023047");
    line(this.targetX - 5, this.targetY - 5, this.targetX + 5, this.targetY + 5);
    line(this.targetX - 5, this.targetY + 5, this.targetX + 5, this.targetY - 5);

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

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}