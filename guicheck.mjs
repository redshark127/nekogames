import http from 'http';
import https from 'https';

const BASE = 'https://redshark127.github.io/nekogames';
const results = { pass: 0, fail: 0, errors: [] };

function check(name, condition, detail = '') {
  if (condition) {
    results.pass++;
    console.log(`  PASS: ${name}`);
  } else {
    results.fail++;
    results.errors.push({ name, detail });
    console.log(`  FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
  });
}

async function main() {
  console.log('=== Nekogames GUI Check ===\n');

  try {
    const r = await fetchUrl(BASE + '/');
    check('index.html loads', r.status === 200, `HTTP ${r.status}`);
    check('index.html is HTML', (r.headers['content-type'] || '').includes('text/html'));
    check('index.html has game-grid div', r.body.includes('id="game-grid"'));
    check('index.html has game-modal', r.body.includes('id="game-modal"'));
    check('index.html has search input', r.body.includes('id="search"'));
    check('index.html has category filter', r.body.includes('id="category-filter"'));
    check('index.html has settings panel', r.body.includes('id="settings-panel"'));
    check('index.html has referrer policy', r.body.includes('no-referrer'));
    check('index.html links style.css', r.body.includes('href="style.css"'));
    check('index.html links script.js', r.body.includes('script.js'), 'missing script.js link');
    check('index.html has bg canvas', r.body.includes('id="bg-canvas"'));
    check('index.html has favicon link', r.body.includes('rel="icon"'));
  } catch (e) {
    check('index.html loads', false, e.message);
  }

  try {
    const r = await fetchUrl(BASE + '/style.css');
    check('style.css loads', r.status === 200, `HTTP ${r.status}`);
    check('style.css has grid layout', r.body.includes('display:grid') || r.body.includes('grid-template'));
    check('style.css has responsive media queries', r.body.includes('@media'));
  } catch (e) {
    check('style.css loads', false, e.message);
  }

  try {
    const r = await fetchUrl(BASE + '/script.js');
    check('script.js loads', r.status === 200, `HTTP ${r.status}`);
    check('script.js has openGame', r.body.includes('openGame'));
    check('script.js has search logic', r.body.includes('search') || r.body.includes('filter'));
    check('script.js has category filter', r.body.includes('category'));
  } catch (e) {
    check('script.js loads', false, e.message);
  }

  try {
    const r = await fetchUrl(BASE + '/games.json');
    check('games.json loads', r.status === 200, `HTTP ${r.status}`);
    const games = JSON.parse(r.body);
    check('games.json is valid JSON', true, `${games.length} games`);
    check('games.json has id field', games.every(g => typeof g.id === 'number'));
    check('games.json has name field', games.every(g => typeof g.name === 'string'));
    check('games.json has url field', games.every(g => typeof g.url === 'string'));
    check('games.json has category field', games.every(g => typeof g.category === 'string'));
    check('games.json has image field', games.every(g => typeof g.image === 'string'));
    const jsdelivr = games.filter(g => g.url.includes('cdn.jsdelivr.net'));
    check('jsDelivr URLs avoid blocked genizy/gn-math users', jsdelivr.filter(g => /\/gh\/(?:genizy|gn-math)\//.test(g.url)).length === 0, `${jsdelivr.filter(g => /\/gh\/(?:genizy|gn-math)\//.test(g.url)).length} blocked`);
    const noah = games.filter(g => g.url.includes('noahstutoring.academy'));
    const geni = games.filter(g => g.url.includes('genizymath.github.io'));
    check('Has wrapper URLs', noah.length > 0 || geni.length > 0, `noahstutoring: ${noah.length}, genizymath: ${geni.length}`);
  } catch (e) {
    check('games.json loads', false, e.message);
  }

  try {
    const r = await fetchUrl(BASE + '/manifest.json');
    check('manifest.json loads', r.status === 200, `HTTP ${r.status}`);
  } catch (e) {
    check('manifest.json loads', false, e.message);
  }

  console.log(`\n=== Results: ${results.pass} passed, ${results.fail} failed ===`);
  if (results.errors.length > 0) {
    console.log('\nFailures:');
    results.errors.forEach(e => console.log(`  - ${e.name}: ${e.detail}`));
  }
  process.exit(results.fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
