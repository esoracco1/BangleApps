// --- Configuration & Palette ---
const SCREEN_W = g.getWidth();
const SCREEN_H = g.getHeight();
const TOP_H = 70; 

const COL_BLACK     = "#000000";
const COL_WHITE     = "#ffffff";
const COL_RED       = "#ff0000"; 
const COL_ORANGE    = "#ff8800"; 
const COL_REDORANGE = "#ff4500"; 
const COL_YELLOW    = "#ffff00"; 
const COL_GREEN     = "#00ff00"; 
const COL_CYAN      = "#00ffff"; 
const COL_BLUE      = "#0000ff"; 
const COL_MAGENTA   = "#ff00ff"; 
const COL_DKGREY    = "#555555"; 

const TEAM_PALETTE = [
  COL_RED, COL_ORANGE, COL_YELLOW, COL_GREEN, COL_CYAN, 
  COL_BLUE, COL_MAGENTA, COL_BLACK, COL_WHITE
];

// --- App State ---
let currentScreen = "HOME"; 
const MENU_OPTIONS = ["Start Match", "Stopwatch", "Settings"];
const MATCH_MENU_OPTIONS = ["Team Info", "Half-Time", "Timeout Timer", "Exit Match"];

let timeLeft = 20 * 60;
let timeoutTime = 60; 
let halftimeTime = 5 * 60; 
let stopwatchMs = 0; 
let timerActive = false; 
let swActive = false;
let timerInterval = null;
let timeoutInterval = null;
let halftimeInterval = null;
let swInterval = null;
let isLocked = true; 
let lockTimer = null; 
let isSwapped = false; 
let koLeft = true;     

let teamA = { score: {t:0, b:0}, colorIdx: 0 }; 
let teamB = { score: {t:0, b:0}, colorIdx: 5 }; 

const BOTTOM_SEQ = [0, 1, 2, 3, 4, 5, "K"];

// --- Drawing Helpers ---

function drawHomeIcon(x, y) {
  g.setColor(COL_YELLOW);
  g.drawRect(x-6, y, x+6, y+7);
  g.drawPoly([x-9, y, x, y-8, x+9, y], false);
  g.fillRect(x-2, y+3, x+2, y+7);
}

function drawBackArrow(x, y) {
  g.setColor(COL_YELLOW);
  g.drawPoly([x-10, y-5, x, y-5, x, y+5, x-15, y+5, x-15, y], false);
  g.fillPoly([x-10, y-9, x-16, y-5, x-10, y-1]);
}

function drawExchangeArrows(x, y, scale) {
  let s = scale || 1;
  g.setColor(COL_WHITE);
  g.drawLine(x - (15*s), y - (6*s), x + (10*s), y - (6*s));
  g.fillPoly([x + (10*s), y - (10*s), x + (16*s), y - (6*s), x + (10*s), y - (2*s)]);
  g.drawLine(x + (15*s), y + (6*s), x - (10*s), y + (6*s));
  g.fillPoly([x - (10*s), y + (2*s), x - (16*s), y + (6*s), x - (10*s), y + (10*s)]);
}

function drawTeamSquare(x1, y1, x2, y2, color) {
  g.setColor(color).fillRect(x1, y1, x2, y2);
  if (color === COL_BLACK) {
    g.setColor(COL_DKGREY).drawRect(x1 - 1, y1 - 1, x2 + 1, y2 + 1);
  }
}

// --- Main Drawing Engine ---

function draw() {
  g.setTheme({bg:COL_BLACK, fg:COL_WHITE, dark:true});
  g.setBgColor(COL_BLACK).clear(true).setColor(COL_WHITE);

  if (currentScreen === "HOME") drawHome();
  else if (currentScreen === "MENU") drawMenu();
  else if (currentScreen === "MATCH") drawMatch();
  else if (currentScreen === "MATCH_MENU") drawMatchMenu();
  else if (currentScreen === "TEAM_INFO") drawTeamInfo();
  else if (currentScreen === "TIMEOUT") drawTimeout();
  else if (currentScreen === "HALFTIME") drawHalftime();
  else if (currentScreen === "STOPWATCH") drawStopwatch();
  
  g.flip(); 
}

function drawHome() {
  let now = new Date();
  g.setFont("Vector", 14).setFontAlign(1, -1).setColor(E.getBattery() < 20 ? COL_RED : COL_GREEN);
  g.drawString(E.getBattery() + "%", SCREEN_W - 10, 10);
  
  g.setColor(COL_WHITE).setFont("Vector", 56).setFontAlign(0, 0);
  g.drawString(now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0'), SCREEN_W / 2, SCREEN_H / 2 - 10);
  
  // Revised Date Formatting to include full year
  let dateParts = now.toString().split(' '); // [Day, Month, Date, Year, Time, TZ]
  let formattedDate = dateParts[1].toUpperCase() + " " + dateParts[2] + ", " + dateParts[3];
  
  g.setFont("Vector", 14).drawString(formattedDate, SCREEN_W / 2, SCREEN_H / 2 + 35);
}

function drawStopwatch() {
  const ICON_X = SCREEN_W - 20, ICON_Y = 18;
  if (!swActive) {
    drawHomeIcon(ICON_X, ICON_Y);
    if (stopwatchMs > 0) {
      g.setColor(COL_YELLOW).drawRect(SCREEN_W/2 - 40, SCREEN_H - 45, SCREEN_W/2 + 40, SCREEN_H - 15);
      g.setFont("Vector", 16).setFontAlign(0, 0).drawString("RESET", SCREEN_W/2, SCREEN_H - 30);
    }
  }
  g.setColor(COL_WHITE).setFont("Vector", 18).setFontAlign(-1, 0).drawString("STOPWATCH", 15, ICON_Y);
  let tw = g.stringWidth("STOPWATCH");
  g.drawLine(15, ICON_Y+10, 15+tw, ICON_Y+10); g.drawLine(15, ICON_Y+13, 15+tw, ICON_Y+13);
  let totalSeconds = Math.floor(stopwatchMs / 1000);
  let m = Math.floor(totalSeconds / 60), s = totalSeconds % 60, ss = Math.floor((stopwatchMs % 1000) / 10);
  let timeStr = m.toString().padStart(2,0) + ":" + s.toString().padStart(2,0) + "." + ss.toString().padStart(2,0);
  g.setFont("Vector", 38).setFontAlign(0, 0).setColor(swActive ? COL_WHITE : COL_YELLOW);
  g.drawString(timeStr, SCREEN_W/2, SCREEN_H/2);
}

function drawTimeout() {
  const ICON_X = SCREEN_W - 20, ICON_Y = 15;
  drawBackArrow(ICON_X, ICON_Y);
  g.setColor(COL_WHITE).setFont("Vector", 18).setFontAlign(-1, 0).drawString("TIMEOUT", 15, ICON_Y + 4);
  let tw = g.stringWidth("TIMEOUT");
  g.drawLine(15, ICON_Y+14, 15+tw, ICON_Y+14); g.drawLine(15, ICON_Y+17, 15+tw, ICON_Y+17);
  g.setFont("Vector", 70).setFontAlign(0, 0).setColor(timeoutTime <= 10 ? COL_YELLOW : COL_WHITE);
  g.drawString(timeoutTime, SCREEN_W/2, SCREEN_H/2 + 10);
}

function drawHalftime() {
  const ICON_X = SCREEN_W - 20, ICON_Y = 15;
  drawBackArrow(ICON_X, ICON_Y);
  g.setColor(COL_WHITE).setFont("Vector", 18).setFontAlign(-1, 0).drawString("HALF-TIME", 15, ICON_Y + 4);
  let tw = g.stringWidth("HALF-TIME");
  g.drawLine(15, ICON_Y+14, 15+tw, ICON_Y+14); g.drawLine(15, ICON_Y+17, 15+tw, ICON_Y+17);
  let m = Math.floor(halftimeTime / 60), s = halftimeTime % 60;
  g.setFont("Vector", 50).setFontAlign(0, 0).setColor(halftimeTime <= 30 ? COL_YELLOW : COL_WHITE);
  g.drawString(m.toString().padStart(2,0) + ":" + s.toString().padStart(2,0), SCREEN_W/2, 75);
  g.setFont("Vector", 12).setColor(COL_WHITE).drawString("TIMER & FOULS", SCREEN_W/2, 105);
  g.drawString("HAVE RESET", SCREEN_W/2, 120);
  let yPos = 155, leftTeam = isSwapped ? teamB : teamA, rightTeam = isSwapped ? teamA : teamB;
  drawTeamSquare(30, yPos - 15, 60, yPos + 15, TEAM_PALETTE[leftTeam.colorIdx]);
  drawTeamSquare(SCREEN_W - 60, yPos - 15, SCREEN_W - 30, yPos + 15, TEAM_PALETTE[rightTeam.colorIdx]);
  drawExchangeArrows(SCREEN_W/2, yPos, 1);
}

function drawMatch() {
  const MID_X = SCREEN_W / 2;
  const SPLIT_Y = TOP_H + ((SCREEN_H - TOP_H) / 2);
  let m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  g.setColor(timerActive ? COL_WHITE : COL_YELLOW).setFont("Vector", 46).setFontAlign(-1, 0);
  g.drawString(m.toString().padStart(2,0) + ":" + s.toString().padStart(2,0), 15, TOP_H/2);
  const lx = SCREEN_W - 20, ly = 18;
  g.setColor(isLocked ? COL_WHITE : COL_GREEN);
  if (isLocked) { g.drawRect(lx-4, ly-7, lx+4, ly); g.fillRect(lx-5, ly, lx+5, ly+8); } 
  else { g.fillRect(lx-4, ly-8, lx-2, ly); g.fillRect(lx-5, ly, lx+5, ly+8); }
  if (!timerActive) {
    g.setColor(COL_REDORANGE).fillRect(lx-8, 58, lx+8, 60); 
    g.fillPoly([lx-6, 58, lx+6, 58, lx+1, 42, lx-1, 42]);
    g.setColor(COL_WHITE).fillPoly([lx-4, 52, lx+4, 52, lx+2, 47, lx-2, 47]);
  }
  let leftTeam = isSwapped ? teamB : teamA, rightTeam = isSwapped ? teamA : teamB;
  let teamObjects = [leftTeam, rightTeam];
  [0, 1].forEach(side => {
    let tObj = teamObjects[side], col = TEAM_PALETTE[tObj.colorIdx];
    let xOffset = side === 0 ? 0 : MID_X, xS = 2 + xOffset, xE = (side === 0 ? MID_X : SCREEN_W) - 2;
    let yS = TOP_H + 2, yE = SCREEN_H - 2;
    for (let i = 0; i < 5; i++) {
      g.setColor((col === COL_BLACK && i === 0) ? COL_DKGREY : col).drawRect(xS + i, yS + i, xE - i, yE - i);
    }
    if ((koLeft && side === 0) || (!koLeft && side === 1)) {
       g.setColor((col === COL_BLACK) ? COL_WHITE : col).setFont("Vector", 10).setFontAlign(-1, 1).drawString("KO-1", xS + 2, yS - 2);
    }
  });
  g.setFontAlign(0, 0).setColor(COL_WHITE).setFont("Vector", 35);
  g.drawString(leftTeam.score.t, MID_X/2, TOP_H + (SPLIT_Y - TOP_H) / 2);
  g.drawString(rightTeam.score.t, MID_X + MID_X/2, TOP_H + (SPLIT_Y - TOP_H) / 2);
  let valLB = BOTTOM_SEQ[leftTeam.score.b], valRB = BOTTOM_SEQ[rightTeam.score.b];
  g.setFont("Vector", 30).setColor(valLB === "K" ? COL_YELLOW : COL_WHITE).drawString(valLB, MID_X/2, SPLIT_Y + (SCREEN_H - SPLIT_Y) / 2);
  g.setColor(valRB === "K" ? COL_YELLOW : COL_WHITE).drawString(valRB, MID_X + MID_X/2, SPLIT_Y + (SCREEN_H - SPLIT_Y) / 2);
}

function drawMenu() {
  MENU_OPTIONS.forEach((opt, i) => {
    let y1 = 25 + (i * 48); 
    g.setColor(COL_WHITE).drawRect(12, y1, SCREEN_W - 12, y1 + 40);
    g.setFont("Vector", 18).setFontAlign(0, 0).drawString(opt, SCREEN_W / 2, y1 + 20);
  });
}

function drawMatchMenu() {
  let now = new Date();
  g.setColor(COL_YELLOW).setFont("Vector", 16).setFontAlign(-1, -1).drawString(now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0'), 12, 12);
  drawBackArrow(SCREEN_W - 20, 15);
  MATCH_MENU_OPTIONS.forEach((opt, i) => {
    let y1 = 40 + (i * 34);
    g.setColor(COL_WHITE).drawRect(12, y1, SCREEN_W - 12, y1 + 28);
    g.setFont("Vector", 15).setFontAlign(0, 0).drawString(opt, SCREEN_W / 2, y1 + 14);
  });
}

function drawTeamInfo() {
  const ICON_X = SCREEN_W - 20, ICON_Y = 15;
  drawBackArrow(ICON_X, ICON_Y);
  g.setColor(COL_WHITE).setFont("Vector", 18).setFontAlign(-1, 0).drawString("TEAM INFO", 15, ICON_Y + 4);
  let tw = g.stringWidth("TEAM INFO");
  g.drawLine(15, ICON_Y + 14, 15 + tw, ICON_Y + 14); g.drawLine(15, ICON_Y + 17, 15 + tw, ICON_Y + 17);
  let yPos = SCREEN_H / 2 - 5, leftTeam = isSwapped ? teamB : teamA, rightTeam = isSwapped ? teamA : teamB;
  drawTeamSquare(25, yPos - 20, 65, yPos + 20, TEAM_PALETTE[leftTeam.colorIdx]);
  drawTeamSquare(SCREEN_W - 65, yPos - 20, SCREEN_W - 25, yPos + 20, TEAM_PALETTE[rightTeam.colorIdx]);
  drawExchangeArrows(SCREEN_W/2, yPos, 1);
  let koY = yPos + 50;
  g.setFont("Vector", 22).setFontAlign(0, 0).setColor(COL_WHITE).drawString("KO-1", koLeft ? 45 : SCREEN_W - 45, koY);
  drawExchangeArrows(SCREEN_W/2, koY, 0.7); 
}

// --- Interaction Logic ---

function handleTouch(xy) {
  if (currentScreen === "MENU") {
    let idx = Math.floor((xy.y - 25) / 48);
    if (idx === 0) currentScreen = "MATCH";
    else if (idx === 1) { stopwatchMs = 0; swActive = false; currentScreen = "STOPWATCH"; }
  } else if (currentScreen === "STOPWATCH") {
    if (!swActive) {
      if (xy.x > SCREEN_W - 50 && xy.y < 40) currentScreen = "HOME";
      else if (stopwatchMs > 0 && xy.y > SCREEN_H - 50) { stopwatchMs = 0; Bangle.buzz(30); draw(); }
    }
  } else if (currentScreen === "MATCH_MENU") {
    if (xy.x > SCREEN_W - 50 && xy.y < 35) currentScreen = "MATCH";
    else {
      let idx = Math.floor((xy.y - 40) / 34);
      if (idx === 0) currentScreen = "TEAM_INFO"; 
      else if (idx === 1) startHalftime();
      else if (idx === 2) startTimeout();
      else if (idx === 3) currentScreen = "HOME";
    }
  } else if (currentScreen === "TIMEOUT") {
    if (xy.x > SCREEN_W - 50 && xy.y < 40) { stopTimeout(); currentScreen = "MATCH"; }
  } else if (currentScreen === "HALFTIME") {
    if (xy.x > SCREEN_W - 50 && xy.y < 40) { stopHalftime(); currentScreen = "MATCH"; }
    else if (xy.y > 135 && xy.y < 175 && xy.x > SCREEN_W/3 && xy.x < (SCREEN_W/3)*2) {
      isSwapped = !isSwapped; koLeft = !koLeft; Bangle.buzz(30);
    }
  } else if (currentScreen === "TEAM_INFO") {
    if (xy.x > SCREEN_W - 50 && xy.y < 35) currentScreen = "MATCH";
    else if (xy.y < SCREEN_H/2 + 25) {
      if (xy.x < SCREEN_W/3) teamA.colorIdx = (teamA.colorIdx+1)%9;
      else if (xy.x > SCREEN_W*0.6) teamB.colorIdx = (teamB.colorIdx+1)%9;
      else { isSwapped = !isSwapped; koLeft = !koLeft; }
    } else koLeft = !koLeft;
  } else if (currentScreen === "MATCH") {
    if (!timerActive && xy.x > SCREEN_W - 45 && xy.y > 35 && xy.y < TOP_H + 15) currentScreen = "MATCH_MENU";
    else if (xy.x > SCREEN_W - 45 && xy.y < 35) { isLocked = !isLocked; if(!isLocked) resetAutoLock(); }
    else if (!isLocked && xy.y > TOP_H) {
      resetAutoLock();
      let isRight = xy.x > SCREEN_W/2, isBottom = xy.y > (TOP_H + (SCREEN_H - TOP_H)/2);
      let targetTeam = isSwapped ? (isRight ? teamA : teamB) : (isRight ? teamB : teamA);
      if (!isBottom) { if (targetTeam.score.t < 99) targetTeam.score.t++; } 
      else { if (targetTeam.score.b < BOTTOM_SEQ.length - 1) targetTeam.score.b++; }
    }
  }
  draw();
}

function startTimeout() {
  timeoutTime = 60; currentScreen = "TIMEOUT";
  if (timeoutInterval) clearInterval(timeoutInterval);
  timeoutInterval = setInterval(() => {
    if (timeoutTime > 0) { timeoutTime--; if (timeoutTime === 0) Bangle.buzz(500); draw(); }
    else stopTimeout();
  }, 1000);
}

function stopTimeout() { if (timeoutInterval) clearInterval(timeoutInterval); timeoutInterval = null; currentScreen = "MATCH"; draw(); }

function startHalftime() {
  timeLeft = 20 * 60; teamA.score.b = 0; teamB.score.b = 0;
  halftimeTime = 5 * 60; currentScreen = "HALFTIME";
  if (halftimeInterval) clearInterval(halftimeInterval);
  halftimeInterval = setInterval(() => {
    if (halftimeTime > 0) { halftimeTime--; if (halftimeTime === 0) Bangle.buzz(500); draw(); }
    else stopHalftime();
  }, 1000);
}

function stopHalftime() { if (halftimeInterval) clearInterval(halftimeInterval); halftimeInterval = null; currentScreen = "MATCH"; draw(); }

function resetAutoLock() {
  if (lockTimer) clearTimeout(lockTimer);
  lockTimer = setTimeout(() => { isLocked = true; draw(); lockTimer = null; }, 2000);
}

Bangle.setUI({
  mode : "custom",
  touch : (n, e) => handleTouch(e),
  swipe : (lr, ud) => { if (currentScreen === "HOME" || currentScreen === "MENU") { currentScreen = (currentScreen === "HOME") ? "MENU" : "HOME"; Bangle.buzz(30); draw(); }},
  btn : (n) => {
    if (currentScreen === "MATCH") {
      if (timerActive) { timerActive = false; if (timerInterval) clearInterval(timerInterval); timerInterval = null; } 
      else { timerActive = true; timerInterval = setInterval(() => { if (timeLeft > 0) { timeLeft--; draw(); } }, 1000); }
    } else if (currentScreen === "STOPWATCH") {
       if (swActive) { swActive = false; if(swInterval) clearInterval(swInterval); swInterval = null; }
       else { swActive = true; let lastTime = Date.now();
         swInterval = setInterval(() => { 
           let now = Date.now(); stopwatchMs += (now - lastTime); lastTime = now;
           if(stopwatchMs >= 5999999) { stopwatchMs = 5999999; swActive = false; clearInterval(swInterval); } 
           draw(); 
         }, 40); 
       }
    } else if (currentScreen === "TIMEOUT") stopTimeout();
    else if (currentScreen === "HALFTIME") stopHalftime();
    else if (currentScreen === "MATCH_MENU" || currentScreen === "TEAM_INFO") currentScreen = "MATCH";
    else currentScreen = "HOME";
    draw();
  }
});

setInterval(() => { if (currentScreen === "HOME") draw(); }, 60000);
draw();
