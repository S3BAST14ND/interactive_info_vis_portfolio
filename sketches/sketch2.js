// Instance-mode sketch for tab 2
registerSketch('sk2', function (p) {
  //size of canvas
  const W = 800;
  const H = 600;
  //borders
  const margin = { left: 90, right: 40, top: 50, bottom: 90 };

  function plotLeft() { return margin.left; }
  function plotRight() { return W - margin.right; }
  function plotTop() { return margin.top; }
  function plotBottom() { return H - margin.bottom; }

  function xFromMinute(min) {
    return p.map(min, 0, 60, plotLeft(), plotRight());
  }

  function yFromHour(hr) {
    return p.map(hr, 0, 12, plotBottom(), plotTop());
  }

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont('system-ui');
  };
  
  //function to get time parts, hour and minute, which are 0-23, 0-59
  function getTimeParts() {
    const rawH = p.hour();
    const m = p.minute();

    let h12 = rawH % 12;
    if (h12 === 0) h12 = 12;

    return { rawH, h12, m };
  }

  function drawAxes() {
    p.push();
    p.stroke(30);
    p.strokeWeight(2);
    p.line(plotLeft(), plotBottom(), plotRight(), plotBottom());
    p.line(plotLeft(), plotTop(), plotLeft(), plotBottom());
    p.pop();
  }

  function drawGrid() {
    p.push();
    p.stroke(0, 0, 0, 25);
    p.strokeWeight(1);

    for (let mm = 0; mm <= 60; mm += 10) {
      const x = xFromMinute(mm);
      p.line(x, plotTop(), x, plotBottom());
    }

    for (let hh = 0; hh <= 12; hh += 3) {
      const y = yFromHour(hh);
      p.line(plotLeft(), y, plotRight(), y);
    }
    p.pop();
  }

  function drawTicks(color, textSize, numMinuteTicks, numHourTicks) {
    const axisCol = p.color(color);

    p.push();
    p.fill(axisCol);
    p.textSize(textSize);

    //x-axis ticks
    for (let i = 0; i <= numMinuteTicks; i++) {
      const minuteVal = (60 / numMinuteTicks) * i;
      const x = xFromMinute(minuteVal);
        p.line(x, plotBottom(), x, plotBottom() + 8);
        p.noStroke();
      p.textAlign(p.CENTER, p.TOP);
      p.text(Math.round(minuteVal), x, plotBottom() + 12);
      p.stroke(axisCol);
    }
  
    for (let i = 0; i <= numHourTicks; i++) {
      const hourVal = (12 / numHourTicks) * i;
      const y = yFromHour(hourVal);
  
      p.line(plotLeft() - 8, y, plotLeft(), y);
  
      p.noStroke();
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(Math.round(hourVal), plotLeft() - 12, y);
      p.stroke(axisCol);
    }

    p.pop();
  }

  function drawLabels (textSize, minuteTicks, hourTicks) {
    p.push();
    p.fill(40);
    p.noStroke();
    p.textSize(textSize);

    p.textAlign(p.CENTER, p.TOP);
    p.text(
      `minutes (${minuteTicks} ticks)`,
      (plotLeft() + plotRight()) / 2,
      plotBottom() + 44
    );

    p.push();
    p.translate(plotLeft() - 58, (plotTop() + plotBottom()) / 2);
    p.rotate(-p.HALF_PI);
    p.textAlign(p.CENTER, p.TOP);
    p.text(
      `hours (${hourTicks} ticks)`, 0, 0
    );    
    p.pop();

    p.pop();
  }

  function drawGraphEncoding(t) {
    const { rawH, h12, m } = t;

    const lineCol = p.color(30)

    const fillCol =
      rawH < 12
        ? p.color(220, 90, 90, 70)
        : p.color(90, 140, 220, 70);

    const x0 = xFromMinute(0);
    const y0 = yFromHour(h12);

    const x1 = xFromMinute(m);
    const y1 = yFromHour(0);

    p.push();
    p.noStroke();
    p.fill(fillCol);
    p.beginShape();
    p.vertex(x0, y1);
    p.vertex(x0, y0);
    p.vertex(x1, y1);
    p.endShape(p.CLOSE);
    p.pop();

    p.push();
    p.stroke(lineCol);
    p.strokeWeight(4);
    p.line(x0, y0, x1, y1);
    p.pop();
  }

  function drawLegend() {
    const x = plotRight() - 30;
    const y = plotTop() - 40;
    const sw = 14;
    const gap = 8;

    p.push();
    p.noStroke();
    p.fill(30);
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);

    p.fill(220, 90, 90, 180);
    p.rect(x, y, sw, sw, 3);
    p.fill(30);
    p.text("AM", x + sw + gap, y + sw / 2);

    const y2 = y + sw + 8;
    p.fill(90, 140, 220, 180);
    p.rect(x, y2, sw, sw, 3);
    p.fill(30);
    p.text("PM", x + sw + gap, y2 + sw / 2);

    p.pop();
  }

function drawSecondsBall(t) {
  const { h12, m } = t;

  const x0 = xFromMinute(0);
  const y0 = yFromHour(h12);

  const x1 = xFromMinute(m);
  const y1 = yFromHour(0);

  const u = p.second() / 60;
  const ballX = p.lerp(x0, x1, u);
  const ballY = p.lerp(y0, y1, u);

  const lineCol = t.rawH >= 12 ? p.color(30) : p.color(20, 130, 70);

  p.push();
  p.noStroke();
  p.fill(lineCol);
  p.circle(ballX, ballY, 10);
  p.pop();
}

  p.draw = function () {
    const t = getTimeParts();
    p.background(248);
    drawAxes();
    drawGrid();
    drawTicks(30, 12, 6, 4); //minute, hour
    drawLabels(12, 6, 4) //see above
    drawGraphEncoding(t)
    drawSecondsBall(t)
    drawLegend();
  };

});