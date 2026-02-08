// Instance-mode sketch for tab 3
registerSketch('sk3', function (p) {

  const W = 800;
  const H = 600;

  const margin = { left: 90, right: 40, top: 50, bottom: 90 };

  function plotLeft() { return margin.left; }
  function plotRight() { return W - margin.right; }
  function plotTop() { return margin.top; }
  function plotBottom() { return H - margin.bottom; }

  function rowY() {
    return plotTop() + (plotBottom() - plotTop()) * 0.55;
  }


  function getTimeParts() {
    const rawH = p.hour();
    const m = p.minute();
    const s = p.second();

    let h12 = rawH % 12;
    if (h12 === 0) h12 = 12;

    return { rawH, h12, m, s };
  }

  function drawBackground() {
    p.background(245);

    p.push();
    p.noStroke();
    p.fill(238, 228, 205);
    p.rect(
      plotLeft(),
      plotTop(),
      plotRight() - plotLeft(),
      plotBottom() - plotTop(),
      18
    );
    p.pop();
  }

  const LOGS = 12;

  function logX(i) {
    return p.lerp(
      plotLeft() + 70,
      plotRight() - 40,
      i / (LOGS - 1)
    );
  }

  function drawLogs(t) {
    const y = rowY();
    const logW = 18;
    const logH = 140;
  
    const currentIdx = t.h12 - 1;
  
    const quarter = Math.floor(t.m / 15);
    const visibleFrac = 1 - quarter * 0.25;
    const visibleHCurrent = logH * visibleFrac;
  
    const minVisibleH = 24;
  
    const dryLogCol = p.color(160, 120, 80);
    const wetLogCol = p.color(100, 65, 30);
  
    p.push();
    p.rectMode(p.CENTER);
    p.noStroke();
  
    for (let i = 0; i < LOGS; i++) {
      const x = logX(i);
      const topY = y - logH / 2;
  
      if (i < currentIdx) {
        const h = minVisibleH;
        const centerY = topY + h / 2;
  
        p.fill(wetLogCol);
        p.rect(x, centerY, logW, h, 6);
        p.circle(x, topY + 6, logW * 0.45);
  
      } else if (i === currentIdx) {
        const h = Math.max(visibleHCurrent, minVisibleH);
        const centerY = topY + h / 2;
  
        p.fill(wetLogCol);
        p.rect(x, centerY, logW, h, 6);
        p.circle(x, topY + 6, logW * 0.45);
  
      } else {
        p.fill(dryLogCol);
        p.rect(x, y, logW, logH, 6);
      }
    }
  
    p.pop();
  }

  function makeShorelineXAtY(t, nowSec) {
    const xTouch = logX(t.h12 - 1);
    const yTouch = rowY();
  
    const slope = 0.22;
    const wavelength = 80;
  
    const tide = 0.5 + 0.5 * p.sin(nowSec * 0.35);
    const amp = 6 + 10 * tide;
  
    const push = 8 * p.sin(nowSec * 0.35);
  
    return function (y) {
      return (
        xTouch +
        push +
        slope * (y - yTouch) +
        amp * p.sin((y / wavelength) * p.TWO_PI)
      );
    };
  }

  function drawTide(shorelineXAtY) {
    p.noStroke();
    p.fill(120, 170, 210);

    p.beginShape();
    p.vertex(plotLeft(), plotTop());
    p.vertex(plotLeft(), plotBottom());

    for (let y = plotBottom(); y >= plotTop(); y -= 12) {
      p.vertex(shorelineXAtY(y), y);
    }

    p.endShape(p.CLOSE);
    drawOceanTexture(shorelineXAtY);

  }

  function drawOceanTexture(shorelineXAtY) {
    p.push();
  
    p.noFill();
    p.stroke(255, 255, 255, 90);
    p.strokeWeight(1.2);
  
    const lines = 7;
    const spacing = 18;
    const stepY = 12;
  
    for (let k = 1; k <= lines; k++) {
      const offset = k * spacing;
  
      p.beginShape();
      for (let y = plotBottom(); y >= plotTop(); y -= stepY) {
        const edgeX = shorelineXAtY(y);
  
        const x = edgeX - offset;
        p.vertex(x, y);
      }
      p.endShape();
    }
  
    p.noStroke();
    p.fill(255, 255, 255, 12);
    for (let i = 0; i < 80; i++) {
      const y = p.random(plotTop(), plotBottom());
      const edgeX = shorelineXAtY(y);
      const x = p.random(plotLeft(), edgeX);
      p.circle(x, y, p.random(1, 2));
    }
  
    p.pop();
  }

  function drawSunMoon(t) {
    const isPM = t.rawH >= 12;

    const x = isPM ? (plotLeft() + 28) : (plotRight() - 28);
    const y = plotTop() + 28;
  
    const isDay = (t.rawH >= 7 && t.rawH < 19);
  
    if (isDay) {
      p.push();
      p.noStroke();
  
      // soft halo
      p.fill(255, 210, 90, 55);
      p.circle(x, y, 44);
      p.fill(255, 210, 90, 35);
      p.circle(x, y, 58);
  
      // sun disk (slight highlight)
      p.fill(255, 196, 70, 235);
      p.circle(x, y, 26);
      p.fill(255, 235, 170, 130);
      p.circle(x - 4, y - 4, 14);
  
      // nicer rays (alternating lengths)
      p.stroke(255, 190, 60, 210);
      p.strokeWeight(2);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * p.TWO_PI;
        const r1 = 18;
        const r2 = (i % 2 === 0) ? 30 : 25;
        p.line(
          x + r1 * p.cos(a),
          y + r1 * p.sin(a),
          x + r2 * p.cos(a),
          y + r2 * p.sin(a)
        );
      }
  
      p.pop();
    } else {
      p.push();
      p.noStroke();
  
      // moon glow
      p.fill(210, 225, 255, 50);
      p.circle(x, y, 52);
      p.fill(210, 225, 255, 30);
      p.circle(x, y, 64);
  
      // moon body
      p.fill(230, 235, 245, 230);
      p.circle(x, y, 24);
  
      // crescent carve (use your background fill color)
      p.fill(245);
      p.circle(x + 7, y - 2, 22);
  
      // a couple stars (tiny + subtle twinkle)
      const tw = 0.5 + 0.5 * p.sin(p.millis() * 0.001 * 1.2);
      p.fill(240, 245, 255, 170);
      p.circle(x - 22, y + 10, 2.0 + tw);
      p.circle(x + 18, y + 14, 1.6 + 0.7 * tw);
      p.circle(x - 12, y - 16, 1.4 + 0.5 * tw);
  
      p.pop();
    }
  }

  function birdPoleIndex(t) {
    let idx = Math.floor(t.m / 5); // 0..11
    if (idx > 11) idx = 11;
    return idx;
  }
  
  function drawBirdOnPole(t) {
    const idx = birdPoleIndex(t);
    const x = logX(idx);
  
    const y = rowY();
    const logH = 140;
    const topY = y - logH / 2;
  
    const perchY = topY - 8;
  
    const wing = 1.8 * p.sin((t.s / 60) * p.TWO_PI);
  
    p.push();
      p.noStroke();
    p.fill(35, 35, 35, 220);
    p.ellipse(x, perchY, 14, 10);
    p.circle(x + 7, perchY - 3, 7);
  
    p.fill(230, 170, 70, 220);
    p.triangle(x + 10, perchY - 3, x + 16, perchY - 1, x + 10, perchY + 1);
  
    p.noFill();
    p.stroke(35, 35, 35, 190);
    p.strokeWeight(2);
    p.arc(x - 2, perchY + 1, 16, 10 + wing, p.PI + 0.4, p.TWO_PI - 0.4);
  
    p.stroke(35, 35, 35, 200);
    p.strokeWeight(1.8);
    p.line(x + 2, perchY + 5, x + 1, perchY + 10);
    p.line(x + 5, perchY + 5, x + 6, perchY + 10);
  
    p.pop();
  }

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont('system-ui');
  };


  p.draw = function () {
    const t = getTimeParts();
    const nowSec = p.millis() * 0.001;
  
    const shorelineXAtY = makeShorelineXAtY(t, nowSec);
  
    drawBackground();
    drawTide(shorelineXAtY);
    drawLogs(t);
    drawBirdOnPole(t);
    drawSunMoon(t);
  };
});
