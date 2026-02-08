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
    const visibleHCurrent = logH * (1 - t.m / 60);

    const dryLogCol = p.color(160, 120, 80);
    const wetLogCol = p.color(100, 65, 30);

    p.push();
    p.rectMode(p.CENTER);
    p.noStroke();

    for (let i = 0; i < LOGS; i++) {
      const x = logX(i);
      const topY = y - logH / 2;

      if (i < currentIdx) {
        //fully submerged
        p.fill(wetLogCol);
        p.circle(x, topY + 10, 8);

      } else if (i === currentIdx) {
        //partially submerged
        if (visibleHCurrent <= 8) {
          p.fill(wetLogCol);
          p.circle(x, topY + 10, 8);
        } else {
          const centerY = topY + visibleHCurrent / 2;
          p.fill(wetLogCol);
          p.rect(x, centerY, logW, visibleHCurrent, 6);
        }

      } else {
        //future logs
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
  
    // calm, static contour lines
    p.noFill();
    p.stroke(255, 255, 255, 90); // much whiter, still soft
    p.strokeWeight(1.2);
  
    const lines = 7;        // fewer = calmer
    const spacing = 18;     // distance between contours
    const stepY = 12;       // smoothness
  
    for (let k = 1; k <= lines; k++) {
      const offset = k * spacing;
  
      p.beginShape();
      for (let y = plotBottom(); y >= plotTop(); y -= stepY) {
        const edgeX = shorelineXAtY(y);
  
        // SAME wave shape, just shifted inward
        const x = edgeX - offset;
        p.vertex(x, y);
      }
      p.endShape();
    }
  
    // very subtle grain (optional but calming)
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
    const x = plotRight() - 28;
    const y = plotTop() + 28;
  
    p.push();
    p.noStroke();
  
    if (t.rawH < 12) {
      p.fill(255, 180, 60);
      p.circle(x, y, 22);
    } else {
      p.fill(200, 215, 235);
      p.circle(x, y, 22);
  
      p.fill(238, 228, 205);
      p.circle(x + 6, y - 2, 18);
    }
  
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
    drawSunMoon(t);
  };

});
