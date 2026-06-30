const GAMES_JSON = 'games.json';

const gameGrid = document.getElementById('game-grid');
const searchInput = document.getElementById('search');
const categoryFilter = document.getElementById('category-filter');
const overlay = document.getElementById('overlay');
const gameFrame = document.getElementById('game-frame');
const modalTitle = document.getElementById('modal-title');
const closeBtn = document.getElementById('close-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

let games = [];

function getIcon(name) {
  const icons = {
    'Tetris': '🧱',
    'Slope': '🏎️',
    'Run 3': '🏃',
    'Cookie Clicker': '🍪',
    'Agar.io': '🟠',
    'Snake': '🐍',
    'Chess': '♟️',
    'Sudoku': '🔢',
    '2048': '🔢',
    'Paper.io': '📄',
  };
  return icons[name] || '🎮';
}

function renderGames(filtered) {
  gameGrid.innerHTML = '';
  filtered.forEach(game => {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="icon">${getIcon(game.name)}</div>
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
  modalTitle.textContent = game.name;
  gameFrame.src = game.url;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeGame() {
  overlay.classList.add('hidden');
  gameFrame.src = '';
  document.body.style.overflow = '';
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
fullscreenBtn.addEventListener('click', () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    gameFrame.requestFullscreen();
  }
});
overlay.addEventListener('click', e => {
  if (e.target === overlay) closeGame();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeGame();
});

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
