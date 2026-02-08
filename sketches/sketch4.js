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

  const match = {
    x0: W * 0.14,
    y0: H * 0.80,
    x:  W * 0.14,
    y:  H * 0.80,
    w:  120,
    h:  16,
    tipR: 9,
    dragging: false,
    grabDx: 0,
    grabDy: 0
  };

  const snuffer = {
    x0: W * 0.22,
    y0: H * 0.22,
    x:  W * 0.22,
    y:  H * 0.22,
    w:  46,
    h:  48,
    handleL: 80,
    dragging: false,
    grabDx: 0,
    grabDy: 0
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

  function spawnSparks(wickX, wickY) {
    if (!lit || !running) return;

    // spawn rate tied to mouse-free time, not seconds display
    // keep it light but lively
    const spawnCount = 2 + Math.floor(p.random(0, 2)); // 2–3
    for (let i = 0; i < spawnCount; i++) {
      if (sparks.length >= MAX_SPARKS) sparks.shift();

      sparks.push({
        x: wickX + p.random(-4, 4),
        y: wickY - 8 + p.random(-2, 2),
        vx: p.random(-0.35, 0.35),
        vy: p.random(-1.3, -0.5),
        r: p.random(2.0, 5.0),
        life: p.random(22, 45),
        t: p.random(0, 9999)
      });
    }
  }

  function updateAndDrawFlame(nowMs, wickX, wickY, candleH) {
    const rem = remainingMs(nowMs);
    if (!lit || !running || durationMs <= 0 || rem <= 0 || candleH <= 12) return;

    // flame glow "breathes" using noise
    const t = nowMs * 0.001;
    const glow = 0.6 + 0.6 * p.noise(t * 1.7, 50);
    const glowR = 34 + 26 * glow;

    // soft glow halo
    p.push();
    p.noStroke();
    p.fill(255, 190, 90, 35);
    p.circle(wickX, wickY - 10, glowR * 2);

    p.fill(255, 220, 140, 55);
    p.circle(wickX, wickY - 10, glowR * 1.25);

    // small bright core (not a teardrop)
    p.fill(255, 245, 200, 210);
    p.circle(wickX + p.random(-0.8, 0.8), wickY - 12 + p.random(-0.8, 0.8), 10 + 6 * glow);
    p.pop();

    // spawn + draw sparks
    spawnSparks(wickX, wickY);

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];

      // turbulence
      const n = p.noise(sp.t + nowMs * 0.0007);
      sp.vx += (n - 0.5) * 0.05;

      sp.x += sp.vx;
      sp.y += sp.vy;

      sp.life -= 1;
      sp.r *= 0.985;

      const alpha = clamp(sp.life / 45, 0, 1) * 220;

      p.push();
      p.noStroke();
      p.fill(255, 210, 120, alpha);
      p.circle(sp.x, sp.y, sp.r * 2);
      p.pop();

      if (sp.life <= 0 || sp.r < 0.8) sparks.splice(i, 1);
    }
  }

  function drawMatch() {
    const stickCol = p.color(190, 150, 110);
    const tipCol = p.color(180, 70, 60);

    p.push();
    p.translate(match.x, match.y);

    p.noStroke();
    p.fill(stickCol);
    p.rectMode(p.CORNER);
    p.rect(0, -match.h / 2, match.w, match.h, 6);

    p.fill(tipCol);
    p.circle(match.w, 0, match.tipR * 2);

    p.pop();
  }

  function matchTipPos() {
    return { x: match.x + match.w, y: match.y };
  }

  function drawSnuffer() {
    p.push();
    p.translate(snuffer.x, snuffer.y);

    // handle
    p.stroke(80);
    p.strokeWeight(6);
    p.line(-snuffer.handleL, -snuffer.h * 0.2, -snuffer.w * 0.15, -snuffer.h * 0.2);
    p.noStroke();

    // cap
    p.fill(120);
    p.rectMode(p.CENTER);
    p.rect(0, 0, snuffer.w, snuffer.h, 10);

    // opening
    p.fill(95);
    p.rect(0, snuffer.h * 0.18, snuffer.w * 0.8, snuffer.h * 0.45, 10);

    p.pop();
  }

  function drawSnuffer() {
    p.push();
    p.translate(snuffer.x, snuffer.y);

    // handle
    p.stroke(80);
    p.strokeWeight(6);
    p.line(-snuffer.handleL, -snuffer.h * 0.2, -snuffer.w * 0.15, -snuffer.h * 0.2);
    p.noStroke();

    // cap
    p.fill(120);
    p.rectMode(p.CENTER);
    p.rect(0, 0, snuffer.w, snuffer.h, 10);

    // opening
    p.fill(95);
    p.rect(0, snuffer.h * 0.18, snuffer.w * 0.8, snuffer.h * 0.45, 10);

    p.pop();
  }



  //flame particles - testing
  const MAX_SPARKS = 160;
  let sparks = [];

  //helpers
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function remainingMs(nowMs) {
    if (!running || startMs === null || durationMs <= 0) return 0;
    return Math.max(0, durationMs - (nowMs - startMs));
  }

  //testing
  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont("system-ui");
  
    durationMs = 30 * 1000;
    startMs = p.millis();
    running = true;
    lit = true;
  };

  p.draw = function () {
    const nowMs = p.millis();

    drawBackground();
    drawHolder();
    
    const c = drawCandle(nowMs);
    updateAndDrawFlame(nowMs, c.wickTopX, c.wickTopY, c.h);

    drawMatch();
    drawSnuffer();
  };
});