// Instance-mode sketch for tab 3
registerSketch('sk3', function (p) {

  const W = 800;
  const H = 600;

  const margin = { left: 60, right: 60, top: 60, bottom: 80 };

  function plotLeft() { return margin.left; }
  function plotRight() { return W - margin.right; }
  function plotTop() { return margin.top; }
  function plotBottom() { return H - margin.bottom; }

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
  };


  p.draw = function () {
    
  };

  p.windowResized = function () { p.resizeCanvas(p.windowWidth, p.windowHeight); };

});
