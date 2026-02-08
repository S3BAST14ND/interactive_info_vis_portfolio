registerSketch('sk4', function (p) {

  const W = 800;
  const H = 600;

  //UI
  let minutesInput;
  let statusText = "Set minutes (max 60). Drag match to wick to light. Drag snuffer to extinguish.";

  //timer state
  let durationMs = 0;
  let startMs = null;
  let running = false;
  let lit = false;

  const candle = {
    x: W * 0.58,
    baseY: H * 0.82,
    w: 90,
    hMax: 400
  };

  function drawBackground() {
    p.background(248);

    p.noStroke();
    p.fill(235);
    p.rect(0, candle.baseY + 30, W, H - (candle.baseY + 30));
  }

  function drawHolder() {
    const plateW = 160;
    const plateH = 18;

    const cupW = 120;
    const cupH = 22;

    p.push();
    p.noStroke();

    p.fill(210);
    p.rectMode(p.CENTER);
    p.rect(candle.x, candle.baseY + 22, plateW, plateH, 12);

    p.fill(200);
    p.rect(candle.x, candle.baseY + 10, cupW, cupH, 10);

    p.fill(185);
    p.rect(candle.x, candle.baseY + 12, cupW * 0.82, cupH * 0.55, 10);

    p.pop();
  }

  //testing only, remove
  function progress01(nowMs) {
    if (!running || startMs === null || durationMs <= 0) return 0;
    return p.constrain((nowMs - startMs) / durationMs, 0, 1);
  }

  function drawCandle(nowMs) {
    const prog = progress01(nowMs);

    const h = candle.hMax * (1 - prog);
    const topY = candle.baseY - h;

    const wax = p.color(245, 235, 210);
    const waxEdge = p.color(0, 0, 0, 35);

    p.push();
    p.rectMode(p.CENTER);

    p.noStroke();
    p.fill(wax);
    p.rect(candle.x, (topY + candle.baseY) / 2, candle.w, h, 18);

    p.noFill();
    p.stroke(waxEdge);
    p.strokeWeight(2);
    p.rect(candle.x, (topY + candle.baseY) / 2, candle.w, h, 18);

    p.noStroke();
    p.fill(235, 220, 190);
    p.beginShape();
    const lipW = candle.w * 0.95;
    const lipY = topY;
    for (let i = 0; i <= 20; i++) {
      const x = p.lerp(candle.x - lipW / 2, candle.x + lipW / 2, i / 20);
      const y = lipY + 6 * p.sin((i / 20) * p.TWO_PI + prog * p.TWO_PI);
      p.vertex(x, y);
    }
    p.vertex(candle.x + lipW / 2, lipY + 16);
    p.vertex(candle.x - lipW / 2, lipY + 16);
    p.endShape(p.CLOSE);

    // wick
    let wickTopX = candle.x;
    let wickTopY = topY - 14;

    if (h > 14) {
      p.stroke(60);
      p.strokeWeight(4);
      p.line(candle.x, topY + 6, candle.x, wickTopY);
    } else {
      wickTopY = topY - 6;
    }

    p.pop();
    return { topY, h, wickTopX, wickTopY };
  }

  //testing
  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont("system-ui");
  
    durationMs = 30 * 1000;
    startMs = p.millis();
    running = true;
  };

  p.draw = function () {
    const nowMs = p.millis();

    drawBackground();
    drawHolder();
    
    const c = drawCandle(nowMs);

  };
});