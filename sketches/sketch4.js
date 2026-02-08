registerSketch('sk4', function (p) {

  const W = 800;
  const H = 600;

  // UI
  let minutesInput;
  let statusText = "Set minutes (max 60). Drag match to wick to light. Drag snuffer to extinguish.";

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont("system-ui");
    ensureUI();
  };

  p.draw = function () {
    
  };

});