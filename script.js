const GAMES_JSON = 'games.json';

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
const downloadSiteBtn = document.getElementById('download-site-btn');
const gameCount = document.getElementById('game-count');
const footerCount = document.getElementById('footer-count');

const CLOAK_TITLE = 'Google Docs';
let origTitle = document.title;

let games = [];
let currentGame = null;
let currentMode = 'direct';
let autoRetried = false;

function renderGames(filtered) {
  gameGrid.innerHTML = '';
  filtered.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    const thumbStyle = game.image ? `style="background-image:url('${game.image}')"` : '';
    card.innerHTML = `
      <div class="thumb" ${thumbStyle}></div>
      <div class="name">${game.name}</div>
      <div class="category">${game.category}</div>
    `;
    card.addEventListener('click', () => openGame(game));
    gameGrid.appendChild(card);
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
}

function isCDNUrl(url) {
  return url.includes('jsdelivr.net') || url.includes('genizymath.github.io');
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
    gameCount.textContent = `${total} games`;
    footerCount.textContent = `${total} games`;
  } else {
    gameCount.textContent = `Showing ${displayed} of ${total} games`;
    footerCount.textContent = `${total} games`;
  }
}

function downloadSite() {
  const btn = downloadSiteBtn;
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
  downloadBtn.textContent = '⏳';
  const name = (currentGame.name || 'game').replace(/[^a-z0-9]/gi, '_');
  const fsScript = `<script>function fs(){document.documentElement.requestFullscreen?.()||document.body.requestFullscreen?.()}fs();document.addEventListener('click',fs);<\/script>`;
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
      const wrapper = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${currentGame.name}</title><style>body{margin:0;overflow:hidden}iframe{width:100vw;height:100vh;border:none}</style>${fsScript}</head><body><iframe src="${currentGame.url}" allowfullscreen></iframe></body></html>`;
      const blob = new Blob([wrapper], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name + '.html';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }
  downloadBtn.textContent = '⬇';
});

if (downloadSiteBtn) {
  downloadSiteBtn.addEventListener('click', downloadSite);
}

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
