const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const overlayText = document.getElementById("overlayText");

let score = 0;
let best = localStorage.getItem("best") || 0;
document.getElementById("best").textContent = best;

let gameRunning = false;
let cameraX = 0;
let exploding = false;

// الصور
const playerImg = new Image();
playerImg.src = "https://i.imgur.com/3GCz3im.png";

const bgImg = new Image();
bgImg.src = "https://i.imgur.com/k2mCiEd.png";

// اللاعب
const player = { x: 100, y: 0, w: 40, h: 50, vy: 0, onGround: false };
const gravity = 0.7;
const speed = 4;

// التحكم
const keys = {};

// كيبورد
document.addEventListener("keydown", e => keys[e.code] = true);
document.addEventListener("keyup", e => keys[e.code] = false);

// أزرار الهاتف
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

leftBtn.addEventListener("touchstart", () => keys["ArrowLeft"] = true);
leftBtn.addEventListener("touchend", () => keys["ArrowLeft"] = false);

rightBtn.addEventListener("touchstart", () => keys["ArrowRight"] = true);
rightBtn.addEventListener("touchend", () => keys["ArrowRight"] = false);

jumpBtn.addEventListener("touchstart", () => keys["Space"] = true);
jumpBtn.addEventListener("touchend", () => keys["Space"] = false);

// الانفجار
const particles = [];
function createExplosion(x, y) {
  particles.length = 0;
  for (let i = 0; i < 30; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 30
    });
  }
  exploding = true;
}

function updateExplosion() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life--;
  });
}

function drawExplosion() {
  particles.forEach(p => {
    if (p.life > 0) {
      ctx.fillStyle = "orange";
      ctx.fillRect(p.x - cameraX, p.y, 4, 4);
    }
  });
}

// العالم
const platforms = [];
const coins = [];
const worldLength = 9000;

// منصات عشوائية
let xPos = 0;
while (xPos < worldLength - 300) {
  xPos += Math.random() * 80 + 60;
  const w = Math.random() * 80 + 80;
  const y = Math.random() * 60 + 260;
  platforms.push({ x: xPos, y, w, h: 20 });
  if (Math.random() > 0.5) coins.push({ x: xPos + w / 2, y: y - 30, taken: false });
  xPos += w;
}
platforms.unshift({ x: -200, y: 320, w: 400, h: 30 });

// الباب
const door = { x: worldLength - 120, y: 260, w: 50, h: 60 };

// إعادة
overlay.addEventListener("click", restart);

// التحديث
function update() {
  if (!gameRunning) return;

  if (!exploding) {
    if (keys["ArrowRight"]) player.x += speed;
    if (keys["ArrowLeft"]) player.x -= speed;

    if ((keys["ArrowUp"] || keys["Space"]) && player.onGround) {
      player.vy = -13;
      player.onGround = false;
    }

    player.vy += gravity;
    player.y += player.vy;
    player.onGround = false;

    platforms.forEach(p => {
      if (
        player.x < p.x + p.w &&
        player.x + player.w > p.x &&
        player.y + player.h <= p.y + 10 &&
        player.y + player.h + player.vy >= p.y
      ) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    });

    coins.forEach(c => {
      if (!c.taken && Math.abs(player.x - c.x) < 30 && Math.abs(player.y - c.y) < 30) {
        c.taken = true;
        score++;
        document.getElementById("score").textContent = score;
      }
    });

    // الباب
    if (
      player.x < door.x + door.w &&
      player.x + player.w > door.x &&
      player.y < door.y + door.h &&
      player.y + player.h > door.y
    ) {
      endGame("🎉 ربحت المرحلة!");
    }

    // سقوط
    if (player.y > canvas.height + 50) {
      createExplosion(player.x + player.w / 2, canvas.height);
      setTimeout(() => endGame("💥 خسرت! اضغط لإعادة اللعب"), 600);
    }

    cameraX = Math.max(0, player.x - 200);
  } else {
    updateExplosion();
  }
}

// الرسم
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  for (let x = -cameraX % bgImg.width; x < canvas.width; x += bgImg.width) {
    ctx.drawImage(bgImg, x, 0);
  }

  ctx.save();
  ctx.translate(-cameraX, 0);

  if (!exploding) ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

  ctx.fillStyle = "#654321";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "gold";
  coins.forEach(c => !c.taken && ctx.fillRect(c.x, c.y, 10, 10));

  ctx.fillStyle = "green";
  ctx.fillRect(door.x, door.y, door.w, door.h);

  ctx.restore();

  if (exploding) drawExplosion();
}

// النهاية
function endGame(text) {
  gameRunning = false;
  exploding = false;
  overlay.style.display = "flex";
  overlayText.textContent = text;

  if (score > best) {
    best = score;
    localStorage.setItem("best", best);
    document.getElementById("best").textContent = best;
  }
}

// إعادة
function restart() {
  score = 0;
  document.getElementById("score").textContent = 0;
  player.x = 100;
  player.y = 0;
  player.vy = 0;
  coins.forEach(c => c.taken = false);
  overlay.style.display = "none";
  gameRunning = true;
  exploding = false;
}

// الحلقة
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
