// Instance-mode sketch for tab 2
registerSketch('sk2', function (p) {
  //size of canvas
  const W = 800;
  const H = 600;
  //borders
  const margin = { left: 90, right: 40, top: 50, bottom: 90 };

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont('system-ui');
  };

  p.draw = function () {
    p.background(248);
  };
});