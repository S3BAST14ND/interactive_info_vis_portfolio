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

  function progress01(nowMs) {
    if (durationMs <= 0) return 0;
    return clamp(1 - remainingMs(nowMs) / durationMs, 0, 1);
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

    const t = nowMs * 0.001;
    const glow = 0.6 + 0.6 * p.noise(t * 1.7, 50);
    const glowR = 34 + 26 * glow;

    p.push();
    p.noStroke();
    p.fill(255, 190, 90, 35);
    p.circle(wickX, wickY - 10, glowR * 2);

    p.fill(255, 220, 140, 55);
    p.circle(wickX, wickY - 10, glowR * 1.25);

    p.fill(255, 245, 200, 210);
    p.circle(wickX + p.random(-0.8, 0.8), wickY - 12 + p.random(-0.8, 0.8), 10 + 6 * glow);
    p.pop();

    spawnSparks(wickX, wickY);

    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];

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

    p.stroke(80);
    p.strokeWeight(6);
    p.line(-snuffer.handleL, -snuffer.h * 0.2, -snuffer.w * 0.15, -snuffer.h * 0.2);
    p.noStroke();

    p.fill(120);
    p.rectMode(p.CENTER);
    p.rect(0, 0, snuffer.w, snuffer.h, 10);

    p.fill(95);
    p.rect(0, snuffer.h * 0.18, snuffer.w * 0.8, snuffer.h * 0.45, 10);

    p.pop();
  }

  function snufferMouthPos() {
    return { x: snuffer.x, y: snuffer.y + snuffer.h * 0.18 };
  }

  function mouseInCanvas() {
    return !(p.mouseX < 0 || p.mouseX > W || p.mouseY < 0 || p.mouseY > H);
  }

  // NEW: Top-level HUD (was incorrectly nested)
  function drawHUD() {
    p.push();
    p.noStroke();
    p.fill(60);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(13);
    p.text(statusText, 20, 18);
    p.text("Minutes input is below the canvas. Max = 60.", 20, 38);
    p.pop();
  }

  // NEW: Top-level drag + release (were incorrectly nested)
  p.mouseDragged = function () {
    if (match.dragging) {
      match.x = clamp(p.mouseX + match.grabDx, 10, W - match.w - 10);
      match.y = clamp(p.mouseY + match.grabDy, 20, H - 20);
    }

    if (snuffer.dragging) {
      snuffer.x = clamp(p.mouseX + snuffer.grabDx, 40, W - 40);
      snuffer.y = clamp(p.mouseY + snuffer.grabDy, 40, H - 40);
    }
  };

  p.mouseReleased = function () {
    if (match.dragging) {
      match.dragging = false;
      match.x = match.x0;
      match.y = match.y0;
    }
    if (snuffer.dragging) {
      snuffer.dragging = false;
      snuffer.x = snuffer.x0;
      snuffer.y = snuffer.y0;
    }
  };

  p.mousePressed = function () {
    if (!mouseInCanvas()) return;

    // match hit test
    {
      const withinX = (p.mouseX >= match.x) && (p.mouseX <= match.x + match.w);
      const withinY = (p.mouseY >= match.y - match.h) && (p.mouseY <= match.y + match.h);
      if (withinX && withinY) {
        match.dragging = true;
        match.grabDx = match.x - p.mouseX;
        match.grabDy = match.y - p.mouseY;
        return;
      }
    }

    // snuffer hit test
    {
      const left = snuffer.x - snuffer.w / 2 - snuffer.handleL;
      const right = snuffer.x + snuffer.w / 2;
      const top = snuffer.y - snuffer.h / 2 - 12;
      const bottom = snuffer.y + snuffer.h / 2 + 12;

      if (p.mouseX >= left && p.mouseX <= right && p.mouseY >= top && p.mouseY <= bottom) {
        snuffer.dragging = true;
        snuffer.grabDx = snuffer.x - p.mouseX;
        snuffer.grabDy = snuffer.y - p.mouseY;
        return;
      }
    }
  };

  //flame particles - testing
  const MAX_SPARKS = 160;
  let sparks = [];

  //helpers
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function remainingMs(nowMs) {
    if (!running || startMs === null) return durationMs;
    if (durationMs <= 0) return 0;
    return clamp(durationMs - (nowMs - startMs), 0, durationMs);
  }

  function readMinutes() {
    const raw = minutesInput ? minutesInput.value() : "";
    const m = parseFloat(raw);
    if (!isFinite(m)) return null;
    return clamp(m, 0.1, 60);
  }

  function setDurationFromInput() {
    const m = readMinutes();
    if (m === null || m <= 0) {
      durationMs = 0;
      if (!running) statusText = "Enter minutes between 0.1 and 60.";
      return false;
    }
    durationMs = Math.round(m * 60 * 1000);
    if (!running) statusText = "Drag match to wick to light. Drag snuffer to extinguish.";
    return true;
  }

  function ensureUI() {
    if (minutesInput) return;
  
    minutesInput = p.createInput("10", "number");
    minutesInput.attribute("min", "0.1");
    minutesInput.attribute("max", "60");
    minutesInput.attribute("step", "0.5");
    minutesInput.style("width", "140px");
    minutesInput.position(20, H + 20);
  
    minutesInput.input(() => {
      if (!running) setDurationFromInput();
    });
  
    setDurationFromInput();
  }

  function lightCandle() {
    if (lit || running) return;
    if (!setDurationFromInput()) return;
  
    lit = true;
    running = true;
    startMs = p.millis();
    statusText = "Burning… Drag snuffer to extinguish.";
  }
  
  function tryLightIfTouchingWick(wickTopX, wickTopY) {
    const tip = matchTipPos();
    const d = p.dist(tip.x, tip.y, wickTopX, wickTopY);
    if (d <= 18) lightCandle();
  }

  function snapToolsHome() {
    match.x = match.x0;
    match.y = match.y0;
    match.dragging = false;
  
    snuffer.x = snuffer.x0;
    snuffer.y = snuffer.y0;
    snuffer.dragging = false;
  }

  function resetAll() {
    running = false;
    lit = false;
    startMs = null;
  
    setDurationFromInput();
    snapToolsHome();
  
    sparks.length = 0;
    statusText = "Reset. Drag match to wick to light. Drag snuffer to extinguish.";
  }

  function extinguishAndReset() {
    resetAll();
    statusText = "Extinguished. Set minutes if needed, then relight with the match.";
  }
  
  function tryExtinguishIfOverWick(wickTopX, wickTopY) {
    if (!lit && !running) return;
  
    const mouth = snufferMouthPos();
    const d = p.dist(mouth.x, mouth.y, wickTopX, wickTopY);
    if (d <= 28) extinguishAndReset();
  }

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont("system-ui");
    ensureUI();
  
    // start unlit
    running = false;
    lit = false;
    startMs = null;
  };

  p.draw = function () {
    ensureUI();
    const nowMs = p.millis();

  if (running && durationMs > 0 && remainingMs(nowMs) <= 0) {
    running = false;
    lit = false;
    sparks.length = 0;
    statusText = "Time's up — candle extinguished. Drag match to relight.";
  }
  
    drawBackground();
    drawHolder();
  
    const c = drawCandle(nowMs);

  if (match.dragging && !lit) {
    tryLightIfTouchingWick(c.wickTopX, c.wickTopY);
  }

  if (snuffer.dragging && (lit || running)) {
    tryExtinguishIfOverWick(c.wickTopX, c.wickTopY);
  }

  updateAndDrawFlame(nowMs, c.wickTopX, c.wickTopY, c.h);
  
    drawMatch();
    drawSnuffer();
    drawHUD();
  };
});