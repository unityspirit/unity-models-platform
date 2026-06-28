// === КОНСТАНТЫ ===
// TOTAL_FRAMES = реальное количество нарезанных кадров!
// Считать: (Get-ChildItem "frames-webp").Count в PowerShell после нарезки
// 5 секций × 8 сек × 10 fps = 400
const TOTAL_FRAMES = 360;     // <-- ЗАМЕНИТЬ на реальное количество кадров!
const PAGE_COUNT   = 5;       // Количество секций (= количество VEO клипов)
const LERP         = 0.02;    // Плавность (0.02 = очень медленно/кинематографично)
const CONCURRENCY  = 48;      // Параллельная загрузка кадров

// === ОПРЕДЕЛЕНИЕ УСТРОЙСТВА ===
const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent) || innerWidth < 768;
const FRAME_DIR = isMobile ? 'frames-mobile' : 'frames-webp';

// === CANVAS SETUP ===
const canvas = document.getElementById('gl-canvas');
const ctx = canvas.getContext('2d');
let canvasDpr = 1;

function resize() {
  canvasDpr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);
  canvas.width  = innerWidth * canvasDpr;
  canvas.height = innerHeight * canvasDpr;
  canvas.style.width  = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  ctx.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0); // Retina поддержка
}
window.addEventListener('resize', resize);
resize();

// === ЗАГРУЗКА КАДРОВ ===
const frames = new Array(TOTAL_FRAMES);
let loadedCount = 0;
let isReady = false;

function frameName(i) {
  return `${FRAME_DIR}/frame_${String(i + 1).padStart(6, '0')}.webp`;
}

async function loadAll() {
  const queue = Array.from({length: TOTAL_FRAMES}, (_, i) => i);
  
  async function worker() {
    while (queue.length) {
      const i = queue.shift();
      await new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => {
          frames[i] = img;
          loadedCount++;
          
          if (loadedCount === 1) {
            isReady = true;
            startAnim();
          }
          resolve();
        };
        img.src = frameName(i); 

      });
    }
  }
  
  await Promise.all(Array.from({length: CONCURRENCY}, worker));
}

// === АНИМАЦИОННЫЙ ЦИКЛ ===
let currentFrame = 0;
let targetFrame  = 0;

window.addEventListener('scroll', () => {
  if (!isReady) return;
  const maxScroll = document.documentElement.scrollHeight - innerHeight;
  const progress  = maxScroll > 0 ? scrollY / maxScroll : 0;
  targetFrame = progress * (TOTAL_FRAMES - 1);
}, { passive: true });

function drawFrame(idx) {
  const img = frames[Math.max(0, Math.min(idx, TOTAL_FRAMES - 1))];
  const W = innerWidth;
  const H = innerHeight;
  
  ctx.clearRect(0, 0, W, H);
  
  // Если изображение реально загружено
  if (img && img.complete && img.naturalWidth) {
    const r  = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const iw = img.naturalWidth * r;
    const ih = img.naturalHeight * r;
    const x  = (W - iw) / 2;
    const y  = (H - ih) / 2;
    
    ctx.drawImage(img, x, y, iw, ih);
  } else {
    // Временный фон пока нет кадров
    ctx.fillStyle = '#06040A';
    ctx.fillRect(0, 0, W, H);
  }
  
  // Радиальная виньетка
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.18, W/2, H/2, H*0.85);
  vig.addColorStop(0, 'rgba(6,4,10,0)');
  vig.addColorStop(1, 'rgba(6,4,10,0.85)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  
  // Затемнение снизу
  const bot = ctx.createLinearGradient(0, H*0.6, 0, H);
  bot.addColorStop(0, 'rgba(6,4,10,0)');
  bot.addColorStop(1, 'rgba(6,4,10,0.88)');
  ctx.fillStyle = bot;
  ctx.fillRect(0, H*0.6, W, H*0.4);
}

function startAnim() {
  function loop() {
    requestAnimationFrame(loop);
    currentFrame += (targetFrame - currentFrame) * LERP;
    if (isReady) drawFrame(Math.round(currentFrame));
  }
  loop();
}

// === АКТИВАЦИЯ СЕКЦИЙ (IntersectionObserver) ===
const pages    = Array.from(document.querySelectorAll('.page'));
const navLinks = Array.from(document.querySelectorAll('.nav-link'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = pages.indexOf(entry.target);
      pages.forEach((p, i) => p.classList.toggle('is-active', i === idx));
      navLinks.forEach((l, i) => l.classList.toggle('active', i === idx));
    }
  });
}, { rootMargin: '-40% 0px -40% 0px' });

pages.forEach(p => observer.observe(p));

// === МОБИЛЬНОЕ МЕНЮ ===
const burger = document.getElementById('burger-menu');
const drawer = document.getElementById('nav-drawer');
const drawerLinks = document.querySelectorAll('.drawer-link');

burger.addEventListener('click', () => {
  drawer.classList.toggle('open');
});

drawerLinks.forEach(link => {
  link.addEventListener('click', () => {
    drawer.classList.remove('open');
  });
});

// === ЗАПУСК ===
loadAll();
