const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

const BASE_DIR = path.join(__dirname, "..", "store-assets", "iap");
const COLORS = {
  bgDark: "#0a0a2e", bgMid: "#1a1a4e", bgDeep: "#0d0d2b",
  cyan: "#00d4ff", gold: "#ffd700", pink: "#ff00cc", green: "#00ff88",
};
const PRODUCTS = [
  { sku: "coin_pack_100", name: "100 Coins", type: "coin", accent: COLORS.gold },
  { sku: "coin_pack_500", name: "500 Coins", type: "coin", accent: COLORS.gold },
  { sku: "premium_unlock", name: "Premium", type: "premium", accent: COLORS.pink },
];

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }
function applyGlow(ctx, color, blur) { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function clearGlow(ctx) { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; }

function drawDarkGradientBg(ctx, w, h) {
  var g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, COLORS.bgDark); g.addColorStop(0.5, COLORS.bgMid); g.addColorStop(1, COLORS.bgDeep);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

function drawNeonGridFloor(ctx, w, h, horizonY) {
  ctx.save(); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 1; ctx.globalAlpha = 0.3;
  for (var i = 0; i < 15; i++) {
    var y = horizonY + (h - horizonY) * (i / 14);
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  var cx = w / 2;
  for (var j = -10; j <= 10; j++) {
    ctx.beginPath(); ctx.moveTo(cx + j * 30, horizonY); ctx.lineTo(cx + j * (w / 8), h); ctx.stroke();
  }
  ctx.restore();
}

function drawCoinIcon(ctx, x, y, r) {
  applyGlow(ctx, COLORS.gold, 20);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = COLORS.gold; ctx.fill();
  clearGlow(ctx);
  ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
  ctx.strokeStyle = "#b8960f"; ctx.lineWidth = r * 0.08; ctx.stroke();
  ctx.fillStyle = "#8B6914";
  ctx.font = "bold " + Math.round(r * 1.1) + "px Arial";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("$", x, y + r * 0.05);
}

function drawStarIcon(ctx, x, y, r) {
  applyGlow(ctx, COLORS.pink, 25); ctx.beginPath();
  for (var i = 0; i < 5; i++) {
    var a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    if (i === 0) ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
    else ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    var ia = a + Math.PI / 5, ir = r * 0.45;
    ctx.lineTo(x + ir * Math.cos(ia), y + ir * Math.sin(ia));
  }
  ctx.closePath(); ctx.fillStyle = COLORS.pink; ctx.fill(); clearGlow(ctx);
}

function drawIcon(ctx, p, x, y, r) {
  if (p.type === "coin") drawCoinIcon(ctx, x, y, r); else drawStarIcon(ctx, x, y, r);
}

function drawNeonText(ctx, text, x, y, sz, color) {
  ctx.font = "bold " + Math.round(sz) + "px Arial";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  applyGlow(ctx, color, 15); ctx.fillStyle = color; ctx.fillText(text, x, y); clearGlow(ctx);
}

function genLogo(p, dir) {
  var c = createCanvas(360, 360), ctx = c.getContext("2d");
  drawIcon(ctx, p, 180, 150, 80);
  drawNeonText(ctx, p.name, 180, 270, 36, p.accent);
  fs.writeFileSync(path.join(dir, "logo_transparent.png"), c.toBuffer("image/png"));
}

function genCover(p, dir, fn, w, h) {
  var c = createCanvas(w, h), ctx = c.getContext("2d");
  drawDarkGradientBg(ctx, w, h);
  applyGlow(ctx, COLORS.cyan, 10); ctx.strokeStyle = COLORS.cyan; ctx.lineWidth = 3;
  ctx.strokeRect(15, 15, w - 30, h - 30); clearGlow(ctx);
  drawIcon(ctx, p, w / 2, h * 0.35, Math.min(w, h) * 0.12);
  var fs2 = Math.min(w, h) * 0.08;
  drawNeonText(ctx, p.name, w / 2, h * 0.58, fs2, p.accent);
  drawNeonText(ctx, "VR Target Shooter", w / 2, h * 0.72, fs2 * 0.45, COLORS.cyan);
  fs.writeFileSync(path.join(dir, fn), c.toBuffer("image/png"));
}

function drawCrosshair(ctx, x, y, s, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 2; applyGlow(ctx, color, 8);
  ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, s * 0.4, 0, Math.PI * 2); ctx.stroke();
  var lines = [[x-s*1.4,y,x-s*0.5,y],[x+s*0.5,y,x+s*1.4,y],[x,y-s*1.4,x,y-s*0.5],[x,y+s*0.5,x,y+s*1.4]];
  lines.forEach(function(l){ ctx.beginPath(); ctx.moveTo(l[0],l[1]); ctx.lineTo(l[2],l[3]); ctx.stroke(); });
  clearGlow(ctx);
}

function drawTarget(ctx, x, y, r, color) {
  applyGlow(ctx, color, 15);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.globalAlpha = 0.4; ctx.fill(); ctx.globalAlpha = 1;
  clearGlow(ctx);
}

function drawHUD(ctx, w, h, score, timer, combo) {
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "left"; applyGlow(ctx, COLORS.cyan, 8); ctx.fillStyle = COLORS.cyan;
  ctx.fillText("SCORE: " + score, 40, 60);
  ctx.textAlign = "center"; applyGlow(ctx, COLORS.green, 8); ctx.fillStyle = COLORS.green;
  ctx.fillText(timer, w / 2, 60);
  ctx.textAlign = "right"; applyGlow(ctx, COLORS.pink, 8); ctx.fillStyle = COLORS.pink;
  ctx.fillText("COMBO x" + combo, w - 40, 60);
  clearGlow(ctx);
  ctx.strokeStyle = COLORS.cyan; ctx.globalAlpha = 0.3; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, 80); ctx.lineTo(w - 20, 80); ctx.stroke();
  ctx.globalAlpha = 1;
}

var SCENES = [
  { score:1250, timer:"1:45", combo:3, targets:[[600,400,"#ff3366",50],[1200,500,"#00d4ff",40],[1800,350,"#00ff88",60]], ch:[1200,500] },
  { score:3400, timer:"0:58", combo:7, targets:[[400,600,"#ff00cc",45],[900,350,"#ff6600",55],[1500,450,"#00d4ff",35],[2000,550,"#00ff88",50]], ch:[900,350] },
  { score:5600, timer:"2:10", combo:12, targets:[[700,500,"#ffd700",60],[1300,300,"#ff00cc",40],[1900,600,"#00ff88",45]], ch:[700,500] },
  { score:8100, timer:"0:22", combo:15, targets:[[500,350,"#ff3366",35],[800,550,"#00d4ff",50],[1100,400,"#00ff88",40],[1600,300,"#ff00cc",55],[2100,500,"#ffd700",45]], ch:[1100,400] },
  { score:10000, timer:"0:05", combo:20, targets:[[300,400,"#00d4ff",40],[650,300,"#ff00cc",50],[1000,550,"#00ff88",35],[1400,350,"#ffd700",60],[1800,500,"#ff3366",45],[2200,400,"#00d4ff",40]], ch:[1400,350] },
];

function genScreenshot(dir, idx) {
  var w = 2560, h = 1440, c = createCanvas(w, h), ctx = c.getContext("2d");
  drawDarkGradientBg(ctx, w, h); drawNeonGridFloor(ctx, w, h, h * 0.6);
  var s = SCENES[idx];
  s.targets.forEach(function(t){ drawTarget(ctx, t[0], t[1], t[3], t[2]); });
  drawCrosshair(ctx, s.ch[0], s.ch[1], 30, COLORS.cyan);
  drawHUD(ctx, w, h, s.score, s.timer, s.combo);
  fs.writeFileSync(path.join(dir, "screenshot_" + (idx+1) + ".png"), c.toBuffer("image/png"));
}

var gen = [];
PRODUCTS.forEach(function(p) {
  var dir = path.join(BASE_DIR, p.sku); ensureDir(dir);
  genLogo(p, dir); gen.push(p.sku + "/logo_transparent.png");
  [["cover_landscape.png",2560,1440],["hero_cover.png",3000,900],["cover_square.png",1440,1440],["cover_portrait.png",1008,1440],["cover_mini_landscape.png",360,202]].forEach(function(cv){
    genCover(p, dir, cv[0], cv[1], cv[2]); gen.push(p.sku + "/" + cv[0]);
  });
  for (var i=0;i<5;i++) { genScreenshot(dir, i); gen.push(p.sku + "/screenshot_" + (i+1) + ".png"); }
});
console.log("Generated " + gen.length + " files:");
gen.forEach(function(f){ console.log("  " + f); });
