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

  function drawBackground() {
    p.background(248);

    p.noStroke();
    p.fill(235);
    p.rect(0, candle.baseY + 30, W, H - (candle.baseY + 30));
  }

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont("system-ui");
  };

  p.draw = function () {
    drawBackground();

  };

});