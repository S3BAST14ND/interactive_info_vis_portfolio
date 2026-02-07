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

  p.draw = function () {
    p.background(248);
  };

});