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

const CLOAK_TITLE = 'Google Docs';
let origTitle = document.title;

let games = [];
let currentGame = null;
let autoRetried = false;

function renderGames(filtered) {
  gameGrid.innerHTML = '';
  filtered.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="thumb" ${game.image ? `style="background-image:url('${game.image}')"` : ''}></div>
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

function openGame(game) {
  currentGame = game;
  autoRetried = false;
  modalTitle.textContent = game.name;
  gameFrame.src = game.url;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeGame() {
  overlay.classList.add('hidden');
  gameFrame.src = '';
  currentGame = null;
  document.body.style.overflow = '';
}

function reloadGame() {
  if (!currentGame) return;
  gameFrame.src = '';
  setTimeout(() => { gameFrame.src = currentGame.url; }, 100);
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

searchInput.addEventListener('input', filterGames);
categoryFilter.addEventListener('change', filterGames);
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
  try {
    const res = await fetch(currentGame.url);
    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (currentGame.name || 'game').replace(/[^a-z0-9]/gi, '_') + '.html';
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(currentGame.url, '_blank');
  }
  downloadBtn.textContent = '⬇';
});
abBtn.addEventListener('click', async () => {
  try {
    const res = await fetch(window.location.href);
    let html = await res.text();
    const base = '<base href="' + window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/') + '">';
    html = html.replace('<head>', '<head>' + base);
    const w = window.open('about:blank');
    w.document.open();
    w.document.write(html);
    w.document.close();
    location.replace('about:blank');
  } catch {
    alert('Could not open about:blank – try allowing popups.');
  }
});
// Auto-retry once per open if iframe is empty (cross-origin fails)
let autoRetryTimer;
gameFrame.addEventListener('load', () => {
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

// Tab cloaking – change title when tab loses focus
document.addEventListener('visibilitychange', () => {
  document.title = document.hidden ? 'Google Docs - Home' : CLOAK_TITLE;
});
// Keep title cloaked always after a brief moment
setTimeout(() => { document.title = CLOAK_TITLE; }, 100);

fetch(GAMES_JSON)
  .then(r => r.json())
  .then(data => {
    games = data;
    populateCategories();
    renderGames(games);
  })
  .catch(err => {
    gameGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:#888;">Failed to load games.</p>';
    console.error(err);
  });
