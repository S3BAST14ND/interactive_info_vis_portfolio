registerSketch("sk5", function (p) {
  const W = 950;
  const H = 600;

  const DATA_PATH = "sketches/overshoot-day.csv";
  const LABEL_ANGLE_OFFSET = p.radians(30);

  const panel = { leftW: 620, rightW: W - 620 };

  const cx = 310;
  const cy = H * 0.52;

  const rInner = 40;
  const rOuter = 235;

  let tbl = null;
  let loadError = false;

  let points = [];
  let minYear = Infinity;
  let maxYear = -Infinity;

  let selectedIndex = -1;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function norm(v, a, b) { return (b === a) ? 0 : (v - a) / (b - a); }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  function polarXY(ang, r) {
    return { x: cx + Math.cos(ang) * r, y: cy + Math.sin(ang) * r };
  }

  function rFromDayPassed(dPassed) {
    const dd = clamp(dPassed, 0, 366);
    return lerp(rInner, rOuter, norm(dd, 0, 365));
  }

  function getCellTrimmed(row, targetName) {
    let v = row.get(targetName);
    if (v !== null && v !== undefined) return v;

    if (!tbl) return null;
    for (let c = 0; c < tbl.columns.length; c++) {
      const colName = tbl.columns[c];
      if (String(colName).trim() === String(targetName).trim()) {
        return row.get(colName);
      }
    }
    return null;
  }

  function toNumOrNull(x) {
    if (x === null || x === undefined) return null;
    const s = String(x).trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function debugLine(msg, x, y) {
    p.push();
    p.noStroke();
    p.fill(20);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(msg, x, y);
    p.pop();
  }

  p.preload = function () {
    loadError = false;
    tbl = p.loadTable(
      DATA_PATH,
      "csv",
      "header",
      () => { },
      () => { loadError = true; tbl = null; }
    );
  };

  function parseTableToPoints() {
    points = [];
    minYear = Infinity;
    maxYear = -Infinity;

    for (let i = 0; i < tbl.getRowCount(); i++) {
      const row = tbl.getRow(i);

      const year = parseInt(getCellTrimmed(row, "Year"), 10);
      const dayPassed = parseInt(getCellTrimmed(row, "Days of year passed"), 10);

      const dateStr = String(getCellTrimmed(row, "Date") ?? "").trim();
      const fullDateStr = String(getCellTrimmed(row, "Full date") ?? "").trim();

      const daysInYearCol = toNumOrNull(getCellTrimmed(row, "Days in a year"));
      const daysLeftCol = toNumOrNull(getCellTrimmed(row, "Days left in a year"));
      const pctLastedCol = toNumOrNull(getCellTrimmed(row, "Percentage of year Earth lasted"));
      const pctLeftCol = toNumOrNull(getCellTrimmed(row, "Percentage of year left when Earth run out"));

      if (!Number.isFinite(year) || !Number.isFinite(dayPassed)) continue;

      minYear = Math.min(minYear, year);
      maxYear = Math.max(maxYear, year);

      const daysInYear = Number.isFinite(daysInYearCol) ? daysInYearCol : 365;
      const daysLeft = Number.isFinite(daysLeftCol) ? daysLeftCol : (daysInYear - dayPassed);

      const pctLasted = Number.isFinite(pctLastedCol)
        ? pctLastedCol
        : (dayPassed / daysInYear) * 100;

      const pctLeft = Number.isFinite(pctLeftCol)
        ? pctLeftCol
        : (daysLeft / daysInYear) * 100;

      points.push({
        year,
        dayPassed,
        dateStr,
        fullDateStr,
        daysInYear,
        daysLeft,
        pctLasted,
        pctLeft
      });
    }

    points.sort((a, b) => a.year - b.year);

    for (const pt of points) {
      const tY = norm(pt.year, minYear, maxYear);
      pt.angle = -p.HALF_PI + tY * p.TWO_PI;
      pt.radius = rFromDayPassed(pt.dayPassed);
      pt.x = cx + Math.cos(pt.angle) * pt.radius;
      pt.y = cy + Math.sin(pt.angle) * pt.radius;
    }

    selectedIndex = points.length ? (points.length - 1) : -1;
  }

  p.setup = function () {
    p.createCanvas(W, H);
    p.textFont("system-ui");
    if (tbl && !loadError) parseTableToPoints();
  };

  function drawEarthIcon(x, y, r, landRot = 0) {
    p.push();
    p.translate(x, y);

    p.noStroke();
    p.fill(70, 140, 220);
    p.circle(0, 0, r * 2);

    p.fill(255, 255, 255, 40);
    p.circle(-r * 0.25, -r * 0.2, r * 1.2);

    p.push();
    p.rotate(landRot);

    p.fill(90, 190, 120);
    p.beginShape();
    p.vertex(-r * 0.55, -r * 0.10);
    p.bezierVertex(-r * 0.55, -r * 0.55, -r * 0.10, -r * 0.55, -r * 0.10, -r * 0.25);
    p.bezierVertex(-r * 0.10, -r * 0.05, -r * 0.25, r * 0.10, -r * 0.45, r * 0.05);
    p.endShape(p.CLOSE);

    p.beginShape();
    p.vertex(r * 0.10, -r * 0.05);
    p.bezierVertex(r * 0.45, -r * 0.35, r * 0.70, -r * 0.10, r * 0.45, r * 0.20);
    p.bezierVertex(r * 0.30, r * 0.35, r * 0.05, r * 0.25, r * 0.10, r * 0.05);
    p.endShape(p.CLOSE);

    p.pop();

    p.noFill();
    p.stroke(30, 80);
    p.strokeWeight(1);
    p.circle(0, 0, r * 2);

    p.pop();
  }

  function drawMonthRingsAndLabelsAligned() {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    let cum = 0;
    const boundaries = [0];
    const mids = [];
    const MONTH_LABEL_AXIS_ROT = p.radians(0);

    for (let m = 0; m < 12; m++) {
      const startDay = cum + 1;
      cum += monthDays[m];
      const endDay = cum;
      boundaries.push(cum);
      mids.push((startDay + endDay) / 2);
    }

    p.push();
    p.noFill();
    p.stroke(200);
    p.strokeWeight(1);

    for (let m = 1; m < boundaries.length; m++) {
      const rB = lerp(rInner, rOuter, norm(boundaries[m], 0, 365));
      p.circle(cx, cy, rB * 2);
    }

    p.stroke(175);
    p.circle(cx, cy, rOuter * 2);
    p.circle(cx, cy, rInner * 2);

    p.noStroke();
    p.fill(120, 120, 160, 190);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);

    for (let m = 0; m < 12; m++) {
      const rMid = lerp(rInner, rOuter, norm(mids[m], 0, 365));
      const ang = -p.HALF_PI + MONTH_LABEL_AXIS_ROT;
      const x = cx + Math.cos(ang) * rMid;
      const y = cy + Math.sin(ang) * rMid;
      p.text(monthNames[m], x, y);
    }

    p.pop();
  }

  function drawInsideOutsideFill() {
    if (points.length < 3) return;

    const insideGreen = p.color(190, 235, 205);
    const outsideRed = p.color(245, 200, 200);

    p.push();
    p.noStroke();

    for (let i = 0; i < points.length; i++) {
      const a0 = points[i].angle;
      const r0 = points[i].radius;

      const j = (i + 1) % points.length;
      let a1 = points[j].angle;
      const r1 = points[j].radius;

      if (j === 0) a1 += p.TWO_PI;

      p.fill(insideGreen);
      p.beginShape();
      let v;

      v = polarXY(a0, rInner); p.vertex(v.x, v.y);
      v = polarXY(a1, rInner); p.vertex(v.x, v.y);
      v = polarXY(a1, r1); p.vertex(v.x, v.y);
      v = polarXY(a0, r0); p.vertex(v.x, v.y);
      p.endShape(p.CLOSE);

      p.fill(outsideRed);
      p.beginShape();

      v = polarXY(a0, r0); p.vertex(v.x, v.y);
      v = polarXY(a1, r1); p.vertex(v.x, v.y);
      v = polarXY(a1, rOuter); p.vertex(v.x, v.y);
      v = polarXY(a0, rOuter); p.vertex(v.x, v.y);
      p.endShape(p.CLOSE);
    }

    p.pop();
  }

  function drawPolarGrid() {
    p.push();

    p.noFill();
    p.stroke(215);
    p.strokeWeight(1);
    for (let i = 1; i <= 7; i++) {
      const rr = lerp(rInner, rOuter, i / 7);
      p.circle(cx, cy, rr * 2);
    }

    const decadeStart = Math.ceil(minYear / 10) * 10;
    const decadeEnd = Math.floor(maxYear / 10) * 10;

    p.stroke(170);
    p.strokeWeight(1);

    for (let y = decadeStart; y <= decadeEnd; y += 10) {
      const tY = norm(y, minYear, maxYear);
      const ang = -p.HALF_PI + tY * p.TWO_PI;

      const x0 = cx + Math.cos(ang) * rInner;
      const y0 = cy + Math.sin(ang) * rInner;
      const x1 = cx + Math.cos(ang) * (rOuter + 18);
      const y1 = cy + Math.sin(ang) * (rOuter + 18);

      p.line(x0, y0, x1, y1);

      p.noStroke();
      p.fill(40);
      p.textSize(22);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(String(y), cx + Math.cos(ang) * (rOuter + 42), cy + Math.sin(ang) * (rOuter + 42));

      p.stroke(170);
    }

    p.pop();
  }

  function drawOvershootPathLine() {
    if (points.length < 2) return;

    p.push();
    p.noFill();
    p.stroke(220, 0, 40);
    p.strokeWeight(4);

    p.beginShape();
    for (const pt of points) p.vertex(pt.x, pt.y);
    p.endShape();

    p.noStroke();
    p.fill(220, 0, 40);
    for (const pt of points) p.circle(pt.x, pt.y, 6);

    p.pop();
  }

  function drawFirstLastLabels() {
    if (points.length < 2) return;

    const first = points[0];
    const last = points[points.length - 1];

    function calloutLabel(pt, yearText, dateText, accentColor, extraDx, extraDy) {
      const radialPad = 34;
      const aCall = pt.angle + LABEL_ANGLE_OFFSET;
      const rCall = pt.radius + radialPad;
      const anchor = polarXY(aCall, rCall);

      const tx = anchor.x + extraDx;
      const ty = anchor.y + extraDy;

      p.push();
      p.stroke(80, 80, 80, 120);
      p.strokeWeight(2);
      p.line(pt.x, pt.y, tx, ty);
      p.pop();

      p.push();
      p.noStroke();
      p.fill(accentColor);
      p.circle(pt.x, pt.y, 10);
      p.pop();

      p.push();
      p.noStroke();
      p.textAlign(p.LEFT, p.BOTTOM);
      p.textSize(26);
      p.fill(40);
      p.text(yearText, tx, ty);

      p.textAlign(p.LEFT, p.TOP);
      p.textSize(22);
      p.fill(accentColor);
      p.text(dateText, tx, ty + 6);
      p.pop();
    }

    calloutLabel(first, String(first.year), first.dateStr, p.color(0, 110, 210), 0, -30);
    calloutLabel(last, String(last.year), last.dateStr, p.color(220, 0, 40), 75, -34);
  }

  function drawRightPanel() {
    const x0 = panel.leftW + 14;
    const yTitle = 54;

    p.push();
    p.fill(235);
    p.noStroke();
    p.rect(panel.leftW, 0, panel.rightW, H);

    p.textAlign(p.LEFT, p.TOP);
    p.fill(200, 0, 40);
    p.textSize(56);
    p.text("Earth\nOvershoot\nDay", x0, yTitle);

    const yDesc = yTitle + 235;
    p.fill(110);
    p.textSize(22);
    p.textStyle(p.ITALIC);
    p.text(
      "The first date Earth can't\nregenerate ecological resources\nused in each year",
      x0,
      yDesc
    );

    p.textStyle(p.NORMAL);
    p.fill(120);
    p.textSize(14);
    p.text("Click a point to update the diagram.", x0, H - 34);

    const diagPadBottom = 56;
    const diagH = 170;
    const diagY = H - diagPadBottom - diagH;

    drawEarthNeedDiagram(x0, diagY, panel.rightW - 28, diagH);

    p.pop();
  }

  function drawEarthNeedDiagram(x, y, w, h) {
    p.push();

    p.noStroke();
    p.fill(248, 248, 248);
    p.rect(x, y, w, h, 14);

    p.noFill();
    p.stroke(0, 0, 0, 35);
    p.strokeWeight(1);
    p.rect(x, y, w, h, 14);

    if (selectedIndex < 0 || selectedIndex >= points.length) {
      p.noStroke();
      p.fill(80);
      p.textSize(15);
      p.textAlign(p.LEFT, p.TOP);
      p.text("Click a year on the red line.", x + 14, y + 14);
      p.pop();
      return;
    }

    const pt = points[selectedIndex];

    const pLasted = clamp(pt.pctLasted, 1e-6, 100);
    const N = 100 / pLasted;

    const baseR = 18;
    const neededR_unclamped = baseR * Math.sqrt(N);

    const maxR = 52;
    const scale = Math.min(1, maxR / neededR_unclamped);

    const r1 = baseR * scale;
    const rN = neededR_unclamped * scale;

    const pad = 14;
    const topTextH = 52;
    const cyD = y + pad + topTextH + 44;

    const cx1 = x + pad + 96;
    const cxN = cx1 + 75;

    const textX = x + w / 2;
    const textY = y + 14;

    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);

    p.fill(60);
    p.textSize(14);
    p.text(`Selected: ${pt.year} (${pt.dateStr})`, textX, textY);

    p.fill(85);
    p.textSize(12);
    p.text(`Percent of year lasted: ${pLasted.toFixed(2)}%`, textX, textY + 20);

    p.fill(200, 0, 40);
    p.textSize(12);
    p.text(`Earths needed: ${N.toFixed(2)}×`, textX, textY + 38);

    const spin = p.frameCount * 0.02;
    drawEarthIcon(cx1, cyD, r1, spin);
    drawEarthIcon(cxN, cyD, rN, spin);

    p.noStroke();
    p.fill(60);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("1×", cx1, cyD + maxR - 18);
    p.text(`${N.toFixed(2)}×`, cxN, cyD + maxR - 18);

    if (scale < 1) {
      p.fill(120);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(11);
      p.text("Scaled down to fit (relative area preserved).", x + pad, y + h - 18);
    }

    p.pop();
  }

  function findNearestPointIndex(mx, my) {
    let bestI = -1;
    let bestD2 = Infinity;

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      const d2 = dist2(mx, my, pt.x, pt.y);
      if (d2 < bestD2) { bestD2 = d2; bestI = i; }
    }

    const hitR = 12;
    if (bestI >= 0 && bestD2 <= hitR * hitR) return bestI;
    return -1;
  }

  p.mousePressed = function () {
    if (p.mouseX > panel.leftW) return;
    const i = findNearestPointIndex(p.mouseX, p.mouseY);
    if (i !== -1) selectedIndex = i;
  };

  function drawHoverTooltip() {
    if (!points.length) return;

    const i = findNearestPointIndex(p.mouseX, p.mouseY);
    if (i === -1) return;

    const pt = points[i];

    const lines = [
      `${pt.year} — ${pt.dateStr}`,
      `Days passed: ${pt.dayPassed}`,
      `Days left: ${Math.round(pt.daysLeft)}`,
      `% year lasted: ${pt.pctLasted.toFixed(2)}%`,
      `% left: ${pt.pctLeft.toFixed(2)}%`,
      pt.fullDateStr ? `Full date: ${pt.fullDateStr}` : null
    ].filter(Boolean);

    p.push();
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);

    const pad = 10;
    let maxW = 0;
    for (const ln of lines) maxW = Math.max(maxW, p.textWidth(ln));
    const boxW = maxW + pad * 2;
    const lineH = 18;
    const boxH = pad * 2 + lineH * lines.length;

    let bx = p.mouseX + 14;
    let by = p.mouseY + 14;

    if (bx + boxW > W - 8) bx = W - 8 - boxW;
    if (by + boxH > H - 8) by = H - 8 - boxH;

    p.noStroke();
    p.fill(30, 30, 30, 220);
    p.rect(bx, by, boxW, boxH, 10);

    p.fill(255);
    for (let k = 0; k < lines.length; k++) {
      p.text(lines[k], bx + pad, by + pad + k * lineH);
    }

    p.noFill();
    p.stroke(30);
    p.strokeWeight(2);
    p.circle(pt.x, pt.y, 20);

    p.pop();
  }

  function drawCenterEarth() {
    const r = 39;
    const spin = p.frameCount * 0.02;
    drawEarthIcon(cx, cy, r, spin);

    p.push();
    p.noStroke();
    p.fill(60);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.pop();
  }

  function drawSelectedIndicatorDot() {
    if (selectedIndex < 0 || selectedIndex >= points.length) return;
    const pt = points[selectedIndex];
  
    const t = p.frameCount * 0.05;
  
    const pulse = 0.5 + 0.5 * Math.sin(t);
  
    const ringR = 22 + pulse * 8;
    const ringAlpha = 60 + pulse * 140;
  
    p.push();
  
    p.noFill();
    p.stroke(0, 0, 0, ringAlpha);
    p.strokeWeight(3);
    p.circle(pt.x, pt.y, ringR);
  
    p.noStroke();
    p.fill(220, 0, 40);
    p.circle(pt.x, pt.y, 9);
  
    p.fill(255);
    p.circle(pt.x, pt.y, 3);
  
    p.pop();
  }
  // Not currently needed
  // function drawClickedPointEarthComparison() {
  //   if (selectedIndex < 0 || selectedIndex >= points.length) return;

  //   const pt = points[selectedIndex];

  //   const pLasted = clamp(pt.pctLasted, 1e-6, 100);
  //   const N = 100 / pLasted;

  //   const baseR = 18;
  //   const rN = baseR * Math.sqrt(N);
  //   const rClamped = Math.min(rN, 60);

  //   const spin = p.frameCount * 0.02;
  //   drawEarthIcon(pt.x, pt.y, rClamped, spin);
  // }

  p.draw = function () {
    p.background(250);

    if (loadError) {
      debugLine("CSV failed to load.", 20, 20);
      debugLine(`Check DATA_PATH: ${DATA_PATH}`, 20, 40);
      return;
    }

    if (!tbl) {
      debugLine("Loading CSV...", 20, 20);
      debugLine(`Path: ${DATA_PATH}`, 20, 40);
      return;
    }

    if (!points.length) {
      debugLine("CSV loaded but parsed 0 rows.", 20, 20);
      debugLine("Check headers / columns.", 20, 40);
      return;
    }

    p.push();
    p.noStroke();
    p.fill(250);
    p.rect(0, 0, panel.leftW, H);
    p.pop();

    drawInsideOutsideFill();
    drawMonthRingsAndLabelsAligned();
    drawPolarGrid();
    drawOvershootPathLine();
    drawFirstLastLabels();
    drawSelectedIndicatorDot()

    drawCenterEarth();

    drawHoverTooltip();
    drawRightPanel();
  };
});