const GAMES_JSON = 'games.json';
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

const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const settingsBackdrop = document.getElementById('settings-backdrop');
const settingsClose = document.getElementById('settings-close');
const themeOptions = document.getElementById('theme-options');
const sizeOptions = document.getElementById('size-options');
const animToggle = document.getElementById('anim-toggle');
const bgOptions = document.getElementById('bg-options');
const cursorOptions = document.getElementById('cursor-options');
const cursorColorInput = document.getElementById('cursor-color');
const bgColorInput = document.getElementById('bg-color');
const accentColorInput = document.getElementById('accent-color');

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
}

function runBackground(type) {
  stopBackground();
  if (!type || type === 'none') return;
  resizeBgCanvas();
  const w = bgCanvas.width;
  const h = bgCanvas.height;

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
        drops[i] += 14;
      }
      bgAnimId = requestAnimationFrame(draw);
    }
    draw();
  } else if (type === 'topography') {
    function draw() {
      const w = bgCanvas.width;
      const h = bgCanvas.height;
      ctx.clearRect(0, 0, w, h);
      const cw = w / 8, ch = h / 6;
      const t = Date.now() / 5000;
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
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        a: Math.random()
      });
    }
    function draw() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      const t = Date.now() / 3000;
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
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 3 + 0.5,
        a: Math.random() * Math.PI * 2
      });
    }
    function draw() {
      ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
      const cx = bgCanvas.width / 2;
      const cy = bgCanvas.height / 2;
      for (const s of stars) {
        s.a += 0.002 * s.z;
        const r = Math.sin(s.a) * 100 * s.z;
        const px = cx + (s.x - cx) + r * 0.1;
        const py = cy + (s.y - cy) + Math.cos(s.a) * 30 * s.z;
        ctx.beginPath();
        ctx.arc(px, py, s.z * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + s.z * 0.2})`;
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
});

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
  document.documentElement.setAttribute('data-size', s.size || 'comfortable');
  document.documentElement.setAttribute('data-anim', s.anim === false ? 'off' : 'on');
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
}

function syncSettingsUI() {
  const s = getSettings();
  const theme = s.theme || 'default';
  const size = s.size || 'comfortable';
  const anim = s.anim !== false;
  const bg = s.background || 'none';
  const cursor = s.cursor || 'default';
  const bgColor = s.bgColor || '';
  const accentColor = s.accentColor || '';
  const cursorColor = s.cursorColor || '#00f0ff';

  themeOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
  sizeOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
  animToggle.querySelector('.toggle-track').classList.toggle('active', anim);
  bgOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bg === bg);
  });
  cursorOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cursor === cursor);
  });
  bgColorInput.value = bgColor || '#07070f';
  accentColorInput.value = accentColor || '#667eea';
  cursorColorInput.value = cursorColor;

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

bgOptions.addEventListener('click', e => {
  const btn = e.target.closest('.setting-option');
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
function renderGames(filtered) {
  gameGrid.innerHTML = '';
  const s = getSettings();
  const animate = s.anim !== false;

  filtered.forEach((game, i) => {
    const card = document.createElement('div');
    card.className = 'game-card';
    if (animate) {
      card.style.transitionDelay = '0s';
      card.style.transition = 'none';
    }
    const thumbStyle = game.image ? `style="background-image:url('${game.image}')"` : '';
    card.innerHTML = `
      <div class="thumb" ${thumbStyle}></div>
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
    btn.textContent = '\u2193 Download All Games (43 MB)';
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

async function fetchItchClassic(url) {
  const resp = await fetch(url);
  let html = await resp.text();
  html = html.replace(/<script[^>]*src="[^"]*htmlgame\.js"[^>]*><\/script>/gi, '');
  html = html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
  const base = url.substring(0, url.lastIndexOf('/') + 1);
  html = html.replace('<head>', '<head><base href="' + base + '">');
  return html;
}

async function fetchNoahstutoring(url) {
  const resp = await fetch(url);
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
      const resp = await fetch(game.url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
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
    alert('Failed to load game: ' + game.name + '\n' + e.message);
    closeGame();
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
    fetch(currentGame.url).then(r => r.text()).then(html => {
      if (isNoahstutoringUrl(currentGame.url)) html = stripInlineScripts(html);
      gameFrame.srcdoc = html;
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
categoryFilter.addEventListener('change', () => { filterGames(); updateCounts(); });
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

fetch(GAMES_JSON)
  .then(r => r.json())
  .then(data => {
    games = data;
    populateCategories();
    renderGames(games);
    updateCounts();
  })
  .catch(err => {
    gameGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Failed to load games.</p>';
    console.error(err);
  });
