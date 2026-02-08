// Instance-mode sketch for tab 3
registerSketch('sk3', function (p) {

  const W = 800;
  const H = 600;

  const margin = { left: 60, right: 60, top: 60, bottom: 80 };

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


  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };


  p.draw = function () {
    const t = getTimeParts();

    drawBackground();
  };

  p.windowResized = function () { p.resizeCanvas(p.windowWidth, p.windowHeight); };

});
