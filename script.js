const GAMES_JSON = 'games.json';
const REQUEST_FORM_URL = 'https://forms.gle/4TP4J3fqpZbanuuQ9';
const SETTINGS_KEY = 'nekogames_settings';

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

const CLOAK_TITLE = 'Google Docs';
let origTitle = document.title;

let games = [];
let currentGame = null;
let currentMode = 'direct';
let autoRetried = false;

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

function applySettings() {
  const s = getSettings();
  document.documentElement.setAttribute('data-theme', s.theme || 'default');
  document.documentElement.setAttribute('data-size', s.size || 'comfortable');
  document.documentElement.setAttribute('data-anim', s.anim === false ? 'off' : 'on');
}

function syncSettingsUI() {
  const s = getSettings();
  const theme = s.theme || 'default';
  const size = s.size || 'comfortable';
  const anim = s.anim !== false;

  themeOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.themeVal === theme);
  });
  sizeOptions.querySelectorAll('.setting-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.size === size);
  });
  animToggle.querySelector('.toggle-track').classList.toggle('active', anim);
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

animToggle.addEventListener('click', e => {
  const track = animToggle.querySelector('.toggle-track');
  const on = !track.classList.contains('active');
  saveSettings({ anim: on });
  applySettings();
  syncSettingsUI();
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

async function fetchItchClassic(url) {
  const resp = await fetch(url);
  let html = await resp.text();
  html = html.replace(/<script[^>]*src="[^"]*htmlgame\.js"[^>]*><\/script>/gi, '');
  html = html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
  const base = url.substring(0, url.lastIndexOf('/') + 1);
  html = html.replace('<head>', '<head><base href="' + base + '">');
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
    fetch(currentGame.url).then(r => r.text()).then(html => { gameFrame.srcdoc = html; });
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
    const res = await fetch(window.location.href);
    let html = await res.text();
    html = html.replace('<head>', '<head><base href="' + window.location.href.replace(/\/?$/, '/') + '">');
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

document.querySelector('.request-btn').addEventListener('click', e => {
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
  document.title = document.hidden ? 'Google Docs - Home' : CLOAK_TITLE;
});
setTimeout(() => { document.title = CLOAK_TITLE; }, 100);

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