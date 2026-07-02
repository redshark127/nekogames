const GAMES_JSON = 'games.json?v=' + Date.now();
const REQUEST_FORM_URL = 'https://forms.gle/4TP4J3fqpZbanuuQ9';
const SETTINGS_KEY = 'nekogames_settings';

const baseHref = window.location.pathname.replace(/\/?$/, '/');
const baseEl = document.createElement('base');
baseEl.href = baseHref;
document.head.prepend(baseEl);
history.replaceState(null, '', '/');

const gameGrid = document.getElementById('game-grid');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const overlay = document.getElementById('overlay');
const gameFrame = document.getElementById('game-frame');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.getElementById('close-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const reloadBtn = document.getElementById('reload-btn');
const openBtn = document.getElementById('open-btn');
const downloadBtn = document.getElementById('download-btn');
const gameModal = document.getElementById('game-modal');
const panicOverlay = document.getElementById('panic-overlay');
const abBtn = document.getElementById('ab-btn');
const gameCount = document.getElementById('game-count');
const footerCount = document.getElementById('footer-count');
const categoryChips = document.getElementById('category-chips');
let activeChip = null;

const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsClose = document.getElementById('settings-close');
const themeOptions = document.getElementById('theme-options');
const sizeOptions = document.getElementById('size-options');
const radiusOptions = document.getElementById('radius-options');
const fontOptions = document.getElementById('font-options');
const animToggle = document.getElementById('anim-toggle');
const cardPulseToggle = document.getElementById('card-pulse-toggle');
const particlesToggle = document.getElementById('particles-toggle');
const bgOptions = document.getElementById('bg-options');
const cursorOptions = document.getElementById('cursor-options');
const cursorColorInput = document.getElementById('cursor-color');
const bgColorInput = document.getElementById('bg-color');
const accentColorInput = document.getElementById('accent-color');
const bgBlurInput = document.getElementById('bg-blur');
const bgSpeedInput = document.getElementById('bg-speed');
const bgOpacityInput = document.getElementById('bg-opacity');
const bgBlurVal = document.getElementById('bg-blur-val');
const bgSpeedVal = document.getElementById('bg-speed-val');
const bgOpacityVal = document.getElementById('bg-opacity-val');

const exportBtn = document.getElementById('export-data-btn');
const importBtn = document.getElementById('import-data-btn');
const importFileInput = document.getElementById('import-file-input');

const cloakActiveTitle = document.getElementById('cloak-active-title');
const cloakInactiveTitle = document.getElementById('cloak-inactive-title');
const cloakFavicon = document.getElementById('cloak-favicon');
const faviconLink = document.querySelector('link[rel="icon"]');

let games = [];
let currentGame = null;
let currentMode = 'direct';
let autoRetried = false;

// ── Background Canvas ──
const bgCanvas = document.getElementById('bg-canvas');
const ctx = bgCanvas.getContext('2d');
let bgAnimId = null;
let bgParticles = [];
let bgStars = [];
let bgDrops = [];
let bgWaveOffset = 0;
let bgNebulaDots = [];
let bgEmbers = [];
let bgShapes = [];
let bgCircuitNodes = [];
let bgSpeed = 1;

function resizeBgCanvas() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

resizeBgCanvas();
window.addEventListener('resize', resizeBgCanvas);

function stopBackground() {
  if (bgAnimId) { cancelAnimationFrame(bgAnimId); bgAnimId = null; }
  ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  bgParticles = [];
  bgStars = [];
  bgDrops = [];
  bgWaveOffset = 0;
  bgNebulaDots = [];
  bgEmbers = [];
  bgShapes = [];
  bgCircuitNodes = [];
}

function runBackground(type, speedOverride) {
  stopBackground();
  if (!type || type === 'none') return;
  resizeBgCanvas();
  const w = bgCanvas.width;
  const h = bgCanvas.height;
  bgSpeed = (speedOverride || getSettings().bgSpeed || 5) / 5;
  const s = bgSpeed;
  const now = () => Date.now() * 0.001 * bgSpeed;

  if (type === 'matrix') {
    const cols = Math.floor(w / 14);
    const drops = Array(cols).fill(0).map(() => Math.random() * h);
    const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃ0123456789ABCDEF';
    let frame = 0;
    function draw() {
      frame++;
      if (frame % 3 !== 0) { ctx.fillStyle = 'rgba(0,0,0,0.05)'; ctx.fillRect(0, 0, w, h); }
      else { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, 0, w, h); }
      ctx.font = '14px monospace';
      for (let i = 0; i < cols; i++) {
        const x = i * 14;
        const y = drops[i];
        ctx.fillStyle = `rgba(0,240,0,${0.3 + Math.random() * 0.7})`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 14 * s;
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();
  } else if (type === 'topography') {
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const cw = w / 8, ch = h / 6;
      const t = now() * 1.2;
      for (let row = -1; row <= 6; row++) {
        ctx.beginPath();
        for (let col = 0; col <= 8; col++) {
          const x = col * cw;
          const y = row * ch + Math.sin(col * 0.5 + t + row) * 20 + Math.sin(col * 0.3 + t * 0.7 + row * 0.5) * 10;
          col === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.04 + (row / 8) * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let col = -1; col <= 8; col++) {
        ctx.beginPath();
        for (let row = 0; row <= 6; row++) {
          const x = col * cw + Math.sin(row * 0.5 + t + col) * 20;
          const y = row * ch;
          row === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.03 + (col / 8) * 0.05})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();
  } else if (type === 'constellation') {
    const count = 120;
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 2 + 0.5, a: Math.random() * 10 });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 2;
      for (const s of stars) {
        const pulse = 0.4 + Math.sin(t + s.a) * 0.3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${pulse})`;
        ctx.fill();
      }
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x;
          const dy = stars[i].y - stars[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(stars[i].x, stars[i].y);
            ctx.lineTo(stars[j].x, stars[j].y);
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.08 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();
  } else if (type === 'starfield') {
    const count = 200;
    const starList = [];
    for (let i = 0; i < count; i++) {
      starList.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random() * 3 + 0.5, a: Math.random() * Math.PI * 2 });
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      const t = now();
      for (const st of starList) {
        st.a += 0.002 * st.z * s;
        const r = Math.sin(st.a) * 100 * st.z;
        const px = cx + (st.x - cx) + r * 0.1;
        const py = cy + (st.y - cy) + Math.cos(st.a) * 30 * st.z;
        ctx.beginPath();
        ctx.arc(px, py, st.z * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + st.z * 0.2})`;
        ctx.fill();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Aurora ──
  } else if (type === 'aurora') {
    const bands = 5;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 0.8;
      for (let b = 0; b < bands; b++) {
        ctx.beginPath();
        const baseY = h * (0.2 + b * 0.12);
        const amp = 40 + b * 15;
        const freq = 0.008 + b * 0.002;
        const hue = 160 + b * 40 + Math.sin(t * 0.1 + b) * 30;
        for (let x = 0; x <= w; x += 2) {
          const y = baseY + Math.sin(x * freq + t * 0.5 + b * 2) * amp * (0.5 + Math.sin(t * 0.3 + b) * 0.3)
                    + Math.sin(x * freq * 2.3 + t * 0.7 + b * 1.3) * amp * 0.3;
          x === 0 ? ctx.moveTo(x, y + amp * 0.5) : ctx.lineTo(x, y + amp * 0.5);
        }
        for (let x = w; x >= 0; x -= 2) {
          const y = baseY + Math.sin(x * freq + t * 0.5 + b * 2) * amp * (0.5 + Math.sin(t * 0.3 + b) * 0.3)
                    + Math.sin(x * freq * 2.3 + t * 0.7 + b * 1.3) * amp * 0.3;
          ctx.lineTo(x, y - amp * 0.5);
        }
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, baseY - amp, 0, baseY + amp);
        grad.addColorStop(0, `hsla(${hue}, 80%, 50%, 0)`);
        grad.addColorStop(0.3, `hsla(${hue + 20}, 70%, 60%, 0.15)`);
        grad.addColorStop(0.5, `hsla(${hue + 40}, 90%, 70%, 0.25)`);
        grad.addColorStop(0.7, `hsla(${hue + 20}, 70%, 60%, 0.15)`);
        grad.addColorStop(1, `hsla(${hue}, 80%, 50%, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Nebula ──
  } else if (type === 'nebula') {
    if (!bgNebulaDots.length) {
      for (let i = 0; i < 8; i++) {
        bgNebulaDots.push({
          x: Math.random() * w, y: Math.random() * h,
          r: 100 + Math.random() * 200,
          hue: 200 + Math.random() * 160,
          dx: (Math.random() - 0.5) * 15,
          dy: (Math.random() - 0.5) * 15,
          phase: Math.random() * Math.PI * 2
        });
      }
      bgStars = Array.from({ length: 150 }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.5 + 0.3, a: Math.random()
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 0.3;
      for (const d of bgNebulaDots) {
        const x = d.x + Math.sin(t + d.phase) * d.dx;
        const y = d.y + Math.cos(t * 0.7 + d.phase) * d.dy;
        const pulse = 1 + Math.sin(t + d.phase) * 0.15;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, d.r * pulse);
        grad.addColorStop(0, `hsla(${d.hue}, 80%, 60%, 0.12)`);
        grad.addColorStop(0.4, `hsla(${d.hue + 30}, 70%, 50%, 0.08)`);
        grad.addColorStop(1, `hsla(${d.hue + 60}, 60%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
      for (const s of bgStars) {
        const pulse = 0.3 + Math.sin(t * 2 + s.a) * 0.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 230, 255, ${pulse})`;
        ctx.fill();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Ocean ──
  } else if (type === 'ocean') {
    const layers = 4;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 0.6;
      for (let l = 0; l < layers; l++) {
        const amp = 20 + l * 18;
        const freq = 0.01 + l * 0.004;
        const speed = 0.5 + l * 0.3;
        const baseY = h * (0.5 + l * 0.12);
        const alpha = 0.06 + l * 0.04;
        const hue = 200 + l * 30;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const y = baseY + Math.sin(x * freq + t * speed) * amp
                    + Math.sin(x * freq * 2.5 + t * speed * 1.7 + l) * amp * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
        ctx.fill();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Fire ──
  } else if (type === 'fire') {
    if (!bgEmbers.length) {
      const count = Math.floor((w * h) / 8000);
      for (let i = 0; i < count; i++) {
        bgEmbers.push(createEmber(w, h));
      }
    }
    function createEmber() {
      return {
        x: Math.random() * w,
        y: h + Math.random() * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -(2 + Math.random() * 4),
        r: 2 + Math.random() * 5,
        hue: 15 + Math.random() * 30,
        life: 0.6 + Math.random() * 0.4,
        maxLife: 0.6 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      };
    }
    function draw() {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const t = now();
      for (let i = bgEmbers.length - 1; i >= 0; i--) {
        const e = bgEmbers[i];
        e.x += e.vx * s + Math.sin(t + e.phase) * 0.5;
        e.y += e.vy * s;
        e.vy -= 0.02 * s;
        e.life -= 0.003 * s;
        if (e.life <= 0 || e.y < -20) {
          bgEmbers[i] = createEmber();
          continue;
        }
        const lifeRatio = e.life / e.maxLife;
        const alpha = lifeRatio * 0.8;
        const radius = e.r * lifeRatio;
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, radius * 3);
        grad.addColorStop(0, `hsla(${e.hue}, 100%, 80%, ${alpha})`);
        grad.addColorStop(0.3, `hsla(${e.hue + 10}, 100%, 60%, ${alpha * 0.6})`);
        grad.addColorStop(0.6, `hsla(${e.hue + 20}, 90%, 40%, ${alpha * 0.3})`);
        grad.addColorStop(1, `hsla(${e.hue + 30}, 80%, 20%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Geometric ──
  } else if (type === 'geometric') {
    if (!bgShapes.length) {
      const count = 30;
      for (let i = 0; i < count; i++) {
        const sides = [3, 4, 6][Math.floor(Math.random() * 3)];
        bgShapes.push({
          x: Math.random() * w, y: Math.random() * h,
          radius: 15 + Math.random() * 40,
          sides,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
          hue: 200 + Math.random() * 160,
          phase: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * 0.3,
          driftY: (Math.random() - 0.5) * 0.3
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 0.5;
      for (const sh of bgShapes) {
        sh.rotation += sh.rotSpeed * s;
        sh.x += sh.driftX * s;
        sh.y += sh.driftY * s;
        if (sh.x < -50) sh.x = w + 50;
        if (sh.x > w + 50) sh.x = -50;
        if (sh.y < -50) sh.y = h + 50;
        if (sh.y > h + 50) sh.y = -50;
        const pulse = 1 + Math.sin(t + sh.phase) * 0.1;
        ctx.beginPath();
        for (let i = 0; i <= sh.sides; i++) {
          const angle = (i / sh.sides) * Math.PI * 2 + sh.rotation;
          const px = sh.x + Math.cos(angle) * sh.radius * pulse;
          const py = sh.y + Math.sin(angle) * sh.radius * pulse;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `hsla(${sh.hue + Math.sin(t * 0.3 + sh.phase) * 30}, 70%, 60%, 0.15)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = `hsla(${sh.hue + Math.sin(t * 0.3 + sh.phase) * 30}, 70%, 60%, 0.03)`;
        ctx.fill();
      }
      for (let i = 0; i < bgShapes.length; i++) {
        for (let j = i + 1; j < bgShapes.length; j++) {
          const dx = bgShapes[i].x - bgShapes[j].x;
          const dy = bgShapes[i].y - bgShapes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(bgShapes[i].x, bgShapes[i].y);
            ctx.lineTo(bgShapes[j].x, bgShapes[j].y);
            ctx.strokeStyle = `rgba(150, 180, 255, ${0.04 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Grid ──
  } else if (type === 'grid') {
    const vanishX = w / 2, vanishY = h * 0.35;
    const lines = 24;
    const horizonLines = 20;
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now();
      ctx.strokeStyle = `rgba(0, 200, 255, 0.06)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < lines; i++) {
        const angle = (i / lines) * Math.PI * 2 + t * 0.02;
        const len = Math.max(w, h) * 1.5;
        ctx.beginPath();
        ctx.moveTo(vanishX, vanishY);
        ctx.lineTo(vanishX + Math.cos(angle) * len, vanishY + Math.sin(angle) * len);
        ctx.stroke();
      }
      for (let i = 1; i <= horizonLines; i++) {
        const y = vanishY + i * (h - vanishY) / horizonLines + Math.sin(t * 0.5 + i * 0.5) * 5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      const glow = ctx.createRadialGradient(vanishX, vanishY, 0, vanishX, vanishY, 100);
      glow.addColorStop(0, 'rgba(0, 200, 255, 0.08)');
      glow.addColorStop(1, 'rgba(0, 200, 255, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(vanishX - 100, vanishY - 100, 200, 200);
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Hexagon ──
  } else if (type === 'hexagon') {
    const hexR = 40;
    const hexW = hexR * Math.sqrt(3);
    const hexH = hexR * 2;
    const cols = Math.ceil(w / hexW) + 1;
    const rows = Math.ceil(h / (hexH * 0.75)) + 1;
    const hexagons = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * hexW + (r % 2) * hexW / 2;
        const cy = r * hexH * 0.75;
        hexagons.push({ cx, cy, phase: Math.random() * Math.PI * 2, hue: 200 + Math.random() * 60 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 0.8;
      ctx.lineWidth = 1;
      for (const hx of hexagons) {
        const pulse = Math.sin(t + hx.phase) * 0.3 + 0.7;
        const alpha = 0.03 + pulse * 0.04;
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const px = hx.cx + Math.cos(angle) * hexR * pulse;
          const py = hx.cy + Math.sin(angle) * hexR * pulse;
          i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `hsla(${hx.hue}, 50%, 60%, ${alpha * 1.5})`;
        ctx.stroke();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();

  // ── Circuit ──
  } else if (type === 'circuit') {
    function generateNodes() {
      const nodes = [];
      const gap = 60;
      const cols = Math.floor(w / gap);
      const rows = Math.floor(h / gap);
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          if (Math.random() > 0.4) continue;
          nodes.push({
            x: c * gap + Math.random() * 20 - 10,
            y: r * gap + Math.random() * 20 - 10,
            connections: [],
            phase: Math.random() * Math.PI * 2
          });
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < gap * 1.8 && Math.random() > 0.3) {
            nodes[i].connections.push(j);
            nodes[j].connections.push(i);
          }
        }
      }
      return nodes;
    }
    bgCircuitNodes = generateNodes();
    const pulses = [];
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = now() * 1.5;
      ctx.strokeStyle = 'rgba(0, 220, 180, 0.06)';
      ctx.lineWidth = 1;
      for (const node of bgCircuitNodes) {
        for (const connIdx of node.connections) {
          const other = bgCircuitNodes[connIdx];
          if (!other) continue;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
      for (const node of bgCircuitNodes) {
        const pulse = 0.3 + Math.sin(t + node.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 2 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 220, 180, ${0.1 + pulse * 0.2})`;
        ctx.fill();
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 10 + pulse * 5);
        glow.addColorStop(0, `rgba(0, 220, 180, ${0.05 + pulse * 0.05})`);
        glow.addColorStop(1, 'rgba(0, 220, 180, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10 + pulse * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();
  }
}

// ── Custom Cursor ──
let cursorRing = null;
let cursorDot = null;
let cursorGlow = null;

function createCursorElements() {
  if (!cursorRing) {
    cursorRing = document.createElement('div');
    cursorRing.id = 'cursor-ring';
    document.body.appendChild(cursorRing);
  }
  if (!cursorDot) {
    cursorDot = document.createElement('div');
    cursorDot.id = 'cursor-dot';
    document.body.appendChild(cursorDot);
  }
  if (!cursorGlow) {
    cursorGlow = document.createElement('div');
    cursorGlow.id = 'cursor-glow';
    document.body.appendChild(cursorGlow);
  }
}

function updateCustomCursor(type, color) {
  const s = getSettings();
  const c = color || s.cursorColor || '#00f0ff';
  if (type === 'ring') {
    createCursorElements();
    cursorRing.style.display = 'block';
    cursorRing.style.width = '32px';
    cursorRing.style.height = '32px';
    cursorRing.style.borderWidth = '2px';
    cursorRing.style.borderColor = c;
    cursorRing.style.boxShadow = `0 0 12px ${c}40, inset 0 0 12px ${c}20`;
    cursorDot.style.display = 'block';
    cursorDot.style.width = '6px';
    cursorDot.style.height = '6px';
    cursorDot.style.background = c;
    cursorDot.style.boxShadow = `0 0 8px ${c}`;
  } else if (type === 'dot') {
    createCursorElements();
    cursorRing.style.display = 'none';
    cursorDot.style.display = 'block';
    cursorDot.style.width = '8px';
    cursorDot.style.height = '8px';
    cursorDot.style.background = c;
    cursorDot.style.boxShadow = `0 0 10px ${c}, 0 0 20px ${c}60`;
  } else {
    if (cursorRing) cursorRing.style.display = 'none';
    if (cursorDot) cursorDot.style.display = 'none';
  }
  document.body.setAttribute('data-cursor', type || 'default');
}

document.addEventListener('mousemove', e => {
  if (cursorRing && cursorRing.style.display !== 'none') {
    cursorRing.style.left = e.clientX + 'px';
    cursorRing.style.top = e.clientY + 'px';
  }
  if (cursorDot && cursorDot.style.display !== 'none') {
    cursorDot.style.left = e.clientX + 'px';
    cursorDot.style.top = e.clientY + 'px';
  }
  if (cursorGlow) {
    cursorGlow.style.left = e.clientX + 'px';
    cursorGlow.style.top = e.clientY + 'px';
  }
});

// ── Interactive Particles ──
let particlesCanvas = null;
let pCtx = null;
let pAnimId = null;
let pParticles = [];
let pMouse = { x: -1000, y: -1000 };
let pMouseActive = false;

function createParticlesCanvas() {
  if (particlesCanvas) return;
  particlesCanvas = document.createElement('canvas');
  particlesCanvas.id = 'particles-canvas';
  document.body.appendChild(particlesCanvas);
  pCtx = particlesCanvas.getContext('2d');
  resizeParticlesCanvas();
  window.addEventListener('resize', resizeParticlesCanvas);
}

function resizeParticlesCanvas() {
  if (!particlesCanvas) return;
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
}

function initParticles() {
  if (!pCtx) return;
  const w = particlesCanvas.width;
  const h = particlesCanvas.height;
  const count = Math.min(60, Math.floor((w * h) / 25000));
  pParticles = [];
  for (let i = 0; i < count; i++) {
    pParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      r: 1.5 + Math.random() * 2.5,
      phase: Math.random() * Math.PI * 2
    });
  }
}

function startParticles() {
  stopParticles();
  if (!pCtx) return;
  initParticles();
  const w = particlesCanvas.width;
  const h = particlesCanvas.height;
  let t = 0;

  function draw() {
    t++;
    pCtx.clearRect(0, 0, w, h);
    const maxDist = 120;

    for (const p of pParticles) {
      p.x += p.vx;
      p.y += p.vy;

      if (pMouseActive) {
        const dx = p.x - pMouse.x;
        const dy = p.y - pMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.5;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
      }

      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }

    for (let i = 0; i < pParticles.length; i++) {
      for (let j = i + 1; j < pParticles.length; j++) {
        const dx = pParticles[i].x - pParticles[j].x;
        const dy = pParticles[i].y - pParticles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.2;
          pCtx.beginPath();
          pCtx.moveTo(pParticles[i].x, pParticles[i].y);
          pCtx.lineTo(pParticles[j].x, pParticles[j].y);
          pCtx.strokeStyle = `rgba(20, 184, 166, ${alpha})`;
          pCtx.lineWidth = 0.5;
          pCtx.stroke();
        }
      }
    }

    for (const p of pParticles) {
      const pulse = 0.6 + Math.sin(t * 0.02 + p.phase) * 0.4;
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(20, 184, 166, ${0.3 * pulse})`;
      pCtx.fill();
      pCtx.beginPath();
      pCtx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
      pCtx.fillStyle = `rgba(20, 184, 166, ${0.06 * pulse})`;
      pCtx.fill();
    }

    pAnimId = requestAnimationFrame(draw);
  }
  draw();
}

function stopParticles() {
  if (pAnimId) { cancelAnimationFrame(pAnimId); pAnimId = null; }
  if (pCtx) pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);
}

document.addEventListener('mousemove', e => {
  pMouse.x = e.clientX;
  pMouse.y = e.clientY;
  pMouseActive = true;
});
document.addEventListener('mouseleave', () => { pMouseActive = false; });

// ── Settings ──
function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch { return {}; }
}

function saveSettings(settings) {
  const current = getSettings();
  Object.assign(current, settings);
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
}

function applyCloak() {
  const s = getSettings();
  const activeTitle = s.cloakActiveTitle || 'Google Docs';
  const inactiveTitle = s.cloakInactiveTitle || 'Google Docs - Home';
  const faviconUrl = s.cloakFavicon || 'https://www.google.com/favicon.ico';
  if (faviconLink) faviconLink.href = faviconUrl;
  document.title = document.hidden ? inactiveTitle : activeTitle;
}

function applySettings() {
  const s = getSettings();
  document.documentElement.setAttribute('data-theme', s.theme || 'default');
  if (!s.theme) document.documentElement.setAttribute('data-theme', 'default');
  document.documentElement.setAttribute('data-size', s.size || 'comfortable');
  document.documentElement.setAttribute('data-anim', s.anim === false ? 'off' : 'on');
  document.documentElement.setAttribute('data-radius', s.cardRadius || 'normal');
  document.documentElement.setAttribute('data-font', s.fontSize || 'normal');
  document.documentElement.setAttribute('data-card-pulse', s.cardPulse === false ? 'off' : 'on');
  const particlesOn = s.particles !== false;
  if (particlesOn) {
    createParticlesCanvas();
    startParticles();
  } else {
    stopParticles();
  }
  runBackground(s.background);
  updateCustomCursor(s.cursor, s.cursorColor);
  applyCloak();
  if (s.bgColor) {
    document.body.style.background = s.bgColor;
  } else {
    document.body.style.background = '';
  }
  if (s.accentColor) {
    document.documentElement.style.setProperty('--accent', s.accentColor);
    document.documentElement.style.setProperty('--cyan', s.accentColor);
  } else {
    document.documentElement.style.removeProperty('--accent');
    document.documentElement.style.removeProperty('--cyan');
  }
  const blur = s.bgBlur || 0;
  document.documentElement.style.setProperty('--bg-blur', blur + 'px');
  const opacity = (s.bgOpacity !== undefined ? s.bgOpacity : 100) / 100;
  document.documentElement.style.setProperty('--bg-opacity', opacity);
}

function syncSettingsUI() {
  const s = getSettings();
  const theme = s.theme || 'default';
  const size = s.size || 'comfortable';
  const anim = s.anim !== false;
  const cardPulse = s.cardPulse !== false;
  const particles = s.particles !== false;
  const bg = s.background || 'none';
  const cursor = s.cursor || 'default';
  const bgColor = s.bgColor || '';
  const accentColor = s.accentColor || '';
  const cursorColor = s.cursorColor || '#00f0ff';
  const cardRadius = s.cardRadius || 'normal';
  const fontSize = s.fontSize || 'normal';
  const bgBlur = s.bgBlur || 0;
  const bgSpeed = s.bgSpeed || 5;
  const bgOpacity = s.bgOpacity !== undefined ? s.bgOpacity : 100;

  themeOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
  sizeOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
  if (radiusOptions) {
    radiusOptions.querySelectorAll('.setting-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.radius === cardRadius);
    });
  }
  if (fontOptions) {
    fontOptions.querySelectorAll('.setting-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.font === fontSize);
    });
  }
  animToggle.querySelector('.toggle-track').classList.toggle('active', anim);
  cardPulseToggle.querySelector('.toggle-track').classList.toggle('active', cardPulse);
  if (particlesToggle) particlesToggle.querySelector('.toggle-track').classList.toggle('active', particles);
  bgOptions.querySelectorAll('.setting-option, .bg-opt').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bg === bg);
  });
  cursorOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cursor === cursor);
  });
  bgColorInput.value = bgColor || '#07070f';
  accentColorInput.value = accentColor || '#667eea';
  cursorColorInput.value = cursorColor;

  if (bgBlurInput) bgBlurInput.value = bgBlur;
  if (bgBlurVal) bgBlurVal.textContent = bgBlur + 'px';
  if (bgSpeedInput) bgSpeedInput.value = bgSpeed;
  if (bgSpeedVal) bgSpeedVal.textContent = (bgSpeed / 5).toFixed(1) + 'x';
  if (bgOpacityInput) bgOpacityInput.value = bgOpacity;
  if (bgOpacityVal) bgOpacityVal.textContent = bgOpacity + '%';

  const s2 = getSettings();
  cloakActiveTitle.value = s2.cloakActiveTitle || 'Google Docs';
  cloakInactiveTitle.value = s2.cloakInactiveTitle || 'Google Docs - Home';
  cloakFavicon.value = s2.cloakFavicon || 'https://www.google.com/favicon.ico';
}

themeOptions.addEventListener('click', e => {
  const btn = e.target.closest('.setting-option');
  if (!btn || !btn.dataset.themeVal) return;
  saveSettings({ theme: btn.dataset.themeVal });
  applySettings();
  syncSettingsUI();
});

sizeOptions.addEventListener('click', e => {
  const btn = e.target.closest('.setting-option');
  if (!btn || !btn.dataset.size) return;
  saveSettings({ size: btn.dataset.size });
  applySettings();
  syncSettingsUI();
});

animToggle.addEventListener('click', () => {
  const track = animToggle.querySelector('.toggle-track');
  const on = !track.classList.contains('active');
  saveSettings({ anim: on });
  applySettings();
  syncSettingsUI();
});

cardPulseToggle.addEventListener('click', () => {
  const track = cardPulseToggle.querySelector('.toggle-track');
  const on = !track.classList.contains('active');
  saveSettings({ cardPulse: on });
  applySettings();
  syncSettingsUI();
});

if (particlesToggle) {
  particlesToggle.addEventListener('click', () => {
    const track = particlesToggle.querySelector('.toggle-track');
    const on = !track.classList.contains('active');
    saveSettings({ particles: on });
    applySettings();
    syncSettingsUI();
  });
}

bgOptions.addEventListener('click', e => {
  const btn = e.target.closest('.setting-option') || e.target.closest('.bg-opt');
  if (!btn || !btn.dataset.bg) return;
  saveSettings({ background: btn.dataset.bg });
  applySettings();
  syncSettingsUI();
});

cursorOptions.addEventListener('click', e => {
  const btn = e.target.closest('.setting-option');
  if (!btn || !btn.dataset.cursor) return;
  saveSettings({ cursor: btn.dataset.cursor });
  applySettings();
  syncSettingsUI();
});

bgColorInput.addEventListener('input', () => {
  saveSettings({ bgColor: bgColorInput.value });
  applySettings();
  syncSettingsUI();
});

accentColorInput.addEventListener('input', () => {
  saveSettings({ accentColor: accentColorInput.value });
  applySettings();
  syncSettingsUI();
});

cursorColorInput.addEventListener('input', () => {
  saveSettings({ cursorColor: cursorColorInput.value });
  applySettings();
  syncSettingsUI();
});

cloakActiveTitle.addEventListener('change', () => {
  saveSettings({ cloakActiveTitle: cloakActiveTitle.value });
  applyCloak();
});
cloakInactiveTitle.addEventListener('change', () => {
  saveSettings({ cloakInactiveTitle: cloakInactiveTitle.value });
  applyCloak();
});
cloakFavicon.addEventListener('change', () => {
  saveSettings({ cloakFavicon: cloakFavicon.value });
  applyCloak();
});

if (radiusOptions) {
  radiusOptions.addEventListener('click', e => {
    const btn = e.target.closest('.setting-option');
    if (!btn || !btn.dataset.radius) return;
    saveSettings({ cardRadius: btn.dataset.radius });
    applySettings();
    syncSettingsUI();
  });
}

if (fontOptions) {
  fontOptions.addEventListener('click', e => {
    const btn = e.target.closest('.setting-option');
    if (!btn || !btn.dataset.font) return;
    saveSettings({ fontSize: btn.dataset.font });
    applySettings();
    syncSettingsUI();
  });
}

if (bgBlurInput) {
  bgBlurInput.addEventListener('input', () => {
    const val = parseInt(bgBlurInput.value);
    saveSettings({ bgBlur: val });
    applySettings();
    if (bgBlurVal) bgBlurVal.textContent = val + 'px';
  });
}

if (bgSpeedInput) {
  bgSpeedInput.addEventListener('input', () => {
    const val = parseInt(bgSpeedInput.value);
    saveSettings({ bgSpeed: val });
    applySettings();
    if (bgSpeedVal) bgSpeedVal.textContent = (val / 5).toFixed(1) + 'x';
  });
}

if (bgOpacityInput) {
  bgOpacityInput.addEventListener('input', () => {
    const val = parseInt(bgOpacityInput.value);
    saveSettings({ bgOpacity: val });
    applySettings();
    if (bgOpacityVal) bgOpacityVal.textContent = val + '%';
  });
}

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.remove('hidden');
  syncSettingsUI();
});

settingsClose.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});

settingsBackdrop.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !settingsPanel.classList.contains('hidden')) {
    settingsPanel.classList.add('hidden');
  }
});

// ── Export / Import ──
function collectAllData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    localStorage: {},
    sessionStorage: {},
    cookies: document.cookie
  };
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    data.localStorage[key] = localStorage.getItem(key);
  }
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      data.sessionStorage[key] = sessionStorage.getItem(key);
    }
  } catch {}
  return data;
}

function exportSiteData() {
  const data = collectAllData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nekogames-backup-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importSiteData(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.version) throw new Error('Invalid backup format');
      for (const key in data.localStorage) {
        localStorage.setItem(key, data.localStorage[key]);
      }
      try {
        for (const key in data.sessionStorage) {
          sessionStorage.setItem(key, data.sessionStorage[key]);
        }
      } catch {}
      if (data.cookies) {
        document.cookie = data.cookies;
      }
      applySettings();
      syncSettingsUI();
      filterGames();
      alert('Import complete! All settings and saves have been restored.');
    } catch (err) {
      alert('Failed to import: ' + err.message);
    }
  };
  reader.readAsText(file);
}

exportBtn.addEventListener('click', exportSiteData);

importBtn.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', e => {
  if (e.target.files.length > 0) {
    importSiteData(e.target.files[0]);
  }
  e.target.value = '';
});

applySettings();

// ── Render ──
const iconCache = {};
function gameIcon(name) {
  if (iconCache[name]) return iconCache[name];
  const first = name.trim().charAt(0).toUpperCase();
  if (!first || first < 'A' || first > 'Z') return '#';
  return first;
}

function renderGames(filtered) {
  gameGrid.innerHTML = '';
  const s = getSettings();
  const animate = s.anim !== false;

  const palette = ['#14b8a6','#f97316','#fbbf24','#a855f7','#f472b6','#34d399','#38bdf8','#fb923c','#818cf8','#2dd4bf'];

  filtered.forEach((game, i) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    if (animate) {
      card.style.transitionDelay = '0s';
      card.style.transition = 'none';
    }
    const icon = gameIcon(game.name);
    const colorIdx = game.category.length % palette.length;
    const iconBg = palette[colorIdx];
    card.innerHTML = `
      <div class="thumb"><span class="game-icon" style="background:${iconBg}">${icon}</span></div>
      <div class="name">${game.name}</div>
      <div class="category">${game.category}</div>
    `;
    card.addEventListener('click', () => openGame(game));
    gameGrid.appendChild(card);

    if (animate) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          card.style.transitionDelay = (i * 25) + 'ms';
          card.style.transition = '';
          card.classList.add('visible');
        });
      });
    } else {
      card.classList.add('visible');
    }
  });
}

function filterGames() {
  const query = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  let filtered = games;
  if (category !== 'all') {
    filtered = filtered.filter(g => g.category === category);
  }
  if (query) {
    filtered = filtered.filter(g => g.name.toLowerCase().includes(query));
  }
  renderGames(filtered);
  const container = document.getElementById('dl-container');
  if (query === 'cocoloco' && !document.getElementById('download-site-btn')) {
    const btn = document.createElement('button');
    btn.id = 'download-site-btn';
    btn.textContent = '\u2193 Download All Games (452 KB)';
    btn.addEventListener('click', downloadSite);
    container.appendChild(btn);
  } else if (query !== 'cocoloco') {
    container.innerHTML = '';
  }
}

function isCDNUrl(url) {
  return url.includes('jsdelivr.net') || url.includes('genizymath.github.io');
}

function isItchClassic(url) {
  return url.includes('html-classic.itch.zone');
}

function isNoahstutoringUrl(url) {
  return url.includes('noahstutoring.academy');
}

function stripInlineScripts(html) {
  return html.replace(/<script>(?!<\/script>)[\s\S]*?<\/script>/gi, '');
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      return resp;
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchItchClassic(url) {
  const resp = await fetchWithRetry(url);
  let html = await resp.text();
  html = html.replace(/<script[^>]*src="[^"]*htmlgame\.js"[^>]*><\/script>/gi, '');
  html = html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
  const base = url.substring(0, url.lastIndexOf('/') + 1);
  html = html.replace('<head>', '<head><base href="' + base + '">');
  return html;
}

async function fetchNoahstutoring(url) {
  const resp = await fetchWithRetry(url);
  let html = await resp.text();
  html = stripInlineScripts(html);
  return html;
}

async function openGame(game) {
  clearTimeout(autoRetryTimer);
  currentGame = game;
  autoRetried = false;
  modalTitle.textContent = game.name;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  gameFrame.removeAttribute('srcdoc');
  gameFrame.src = '';
  try {
    if (isCDNUrl(game.url)) {
      currentMode = 'srcdoc';
      const resp = await fetchWithRetry(game.url);
      gameFrame.srcdoc = await resp.text();
    } else if (isItchClassic(game.url)) {
      currentMode = 'srcdoc';
      gameFrame.srcdoc = await fetchItchClassic(game.url);
    } else if (isNoahstutoringUrl(game.url)) {
      currentMode = 'srcdoc';
      gameFrame.srcdoc = await fetchNoahstutoring(game.url);
    } else {
      currentMode = 'direct';
      gameFrame.src = game.url;
    }
  } catch (e) {
    currentMode = 'direct';
    gameFrame.src = game.url;
  }
  if (game.name.toLowerCase().includes('minesweeper')) {
    setTimeout(() => {
      if (!document.fullscreenElement) {
        gameModal.requestFullscreen().catch(() => {});
      }
    }, 500);
  }
}

function closeGame() {
  overlay.classList.add('hidden');
  gameFrame.removeAttribute('srcdoc');
  gameFrame.src = '';
  currentGame = null;
  document.body.style.overflow = '';
}

function reloadGame() {
  if (!currentGame) return;
  if (currentMode === 'srcdoc') {
    gameFrame.srcdoc = '';
    fetchWithRetry(currentGame.url).then(r => r.text()).then(html => {
      if (isNoahstutoringUrl(currentGame.url)) html = stripInlineScripts(html);
      gameFrame.srcdoc = html;
    }).catch(() => {
      currentMode = 'direct';
      gameFrame.src = currentGame.url;
    });
  } else {
    gameFrame.removeAttribute('srcdoc');
    gameFrame.src = '';
    setTimeout(() => { gameFrame.src = currentGame.url; }, 100);
  }
}

function populateCategories() {
  const cats = [...new Set(games.map(g => g.category))].sort();
  cats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });
}

function updateCounts() {
  const total = games.length;
  const displayed = gameGrid.children.length;
  if (displayed === total) {
    gameCount.textContent = total + ' games';
    footerCount.textContent = total + ' games';
  } else {
    gameCount.textContent = 'Showing ' + displayed + ' of ' + total + ' games';
    footerCount.textContent = total + ' games';
  }
}

function downloadSite() {
  const a = document.createElement('a');
  a.href = 'nekogames-full.zip';
  a.download = 'nekogames-full.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

searchInput.addEventListener('input', () => { filterGames(); updateCounts(); });
categoryFilter.addEventListener('change', () => {
  filterGames();
  updateCounts();
  categoryChips.querySelectorAll('.cat-chip').forEach(c => {
    c.classList.toggle('active', c.dataset.cat === categoryFilter.value);
  });
});
closeBtn.addEventListener('click', closeGame);
reloadBtn.addEventListener('click', reloadGame);
fullscreenBtn.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    gameModal.requestFullscreen();
  }
});
openBtn.addEventListener('click', () => {
  if (currentGame) window.open(currentGame.url, '_blank');
});
downloadBtn.addEventListener('click', async () => {
  if (!currentGame) return;
  downloadBtn.textContent = '\u23F3';
  const name = (currentGame.name || 'game').replace(/[^a-z0-9]/gi, '_');
  const fsScript = '<script>function fs(){document.documentElement.requestFullscreen?.()||document.body.requestFullscreen?.()}fs();document.addEventListener(\'click\',fs);<\/script>';
  if (currentMode === 'srcdoc' && gameFrame.srcdoc) {
    const html = gameFrame.srcdoc.replace('</head>', fsScript + '</head>');
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.html';
    a.click();
    URL.revokeObjectURL(a.href);
  } else {
    try {
      const res = await fetch(currentGame.url);
      const html = (await res.text()).replace('</head>', fsScript + '</head>');
      const blob = new Blob([html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.html';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      const wrapper = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + currentGame.name + '</title><style>body{margin:0;overflow:hidden}iframe{width:100vw;height:100vh;border:none}</style>' + fsScript + '</head><body><iframe src="' + currentGame.url + '" allowfullscreen></iframe></body></html>';
      const blob = new Blob([wrapper], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.html';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
  downloadBtn.textContent = '\u2B07';
});

abBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(baseHref);
    let html = await res.text();
    html = html.replace('<head>', '<head><base href="' + baseHref + '">');
    var w = window.open('about:blank');
    if (!w) {
      alert('Popup blocked. Allow popups for this site and try again.');
      return;
    }
    try {
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      alert('Failed to write to about:blank: ' + e.message);
      return;
    }
  } catch(e) {
    alert('Could not open about:blank: ' + e.message);
  }
});

document.querySelector('#request-btn').addEventListener('click', e => {
  if (REQUEST_FORM_URL === '#') {
    e.preventDefault();
    alert('No request form URL configured yet.');
  }
});

let autoRetryTimer;
gameFrame.addEventListener('load', () => {
  if (currentMode !== 'direct') return;
  clearTimeout(autoRetryTimer);
  autoRetryTimer = setTimeout(() => {
    if (autoRetried) return;
    try {
      const doc = gameFrame.contentDocument || gameFrame.contentWindow?.document;
      if (doc && doc.body.innerHTML.trim() === '') throw new Error('empty body');
    } catch {
      autoRetried = true;
      reloadGame();
    }
  }, 8000);
});

overlay.addEventListener('click', e => {
  if (e.target === overlay) closeGame();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!settingsPanel.classList.contains('hidden')) {
      settingsPanel.classList.add('hidden');
      return;
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      closeGame();
    }
  }
  if (e.key === '`') {
    e.preventDefault();
    panicOverlay.classList.toggle('hidden');
  }
});

document.addEventListener('visibilitychange', () => {
  applyCloak();
});

// ── Collapsible Settings Sections ──
document.querySelectorAll('.setting-section-hdr').forEach(hdr => {
  hdr.addEventListener('click', () => {
    const section = hdr.parentElement;
    section.classList.toggle('open');
  });
});

// ── Category Chips ──
function populateChips() {
  const cats = [...new Set(games.map(g => g.category))].sort();
  const allChip = document.createElement('button');
  allChip.className = 'cat-chip active';
  allChip.dataset.cat = 'all';
  allChip.innerHTML = '<span class="chip-dot" style="background:var(--accent)"></span>All';
  allChip.addEventListener('click', () => {
    categoryFilter.value = 'all';
    filterGames();
    updateCounts();
    chips();
  });
  categoryChips.appendChild(allChip);

  const palette = ['#f472b6','#a855f7','#667eea','#34d399','#fbbf24','#fb923c','#f87171','#38bdf8','#818cf8','#2dd4bf','#f472b6','#c084fc'];
  cats.forEach((cat, i) => {
    const chip = document.createElement('button');
    chip.className = 'cat-chip';
    chip.dataset.cat = cat;
    chip.innerHTML = `<span class="chip-dot" style="background:${palette[i % palette.length]}"></span>${cat}`;
    chip.addEventListener('click', () => {
      categoryFilter.value = cat;
      filterGames();
      updateCounts();
      chips();
    });
    categoryChips.appendChild(chip);
  });

  function chips() {
    categoryChips.querySelectorAll('.cat-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.cat === categoryFilter.value);
    });
  }
}

createCursorElements();

fetch(GAMES_JSON)
  .then(r => r.json())
  .then(data => {
    games = data;
    populateCategories();
    populateChips();
    renderGames(games);
    updateCounts();
  })
  .catch(err => {
    gameGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Failed to load games.</p>';
    console.error(err);
  });
