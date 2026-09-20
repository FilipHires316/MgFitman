const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, '..', 'data', 'favorites.json');

function ensureFile() {
  if (!fs.existsSync(FILE_PATH)) {
    fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
    fs.writeFileSync(FILE_PATH, '{}', 'utf8');
  }
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getFavorites(userId) {
  const all = readAll();
  return all[userId] || [];
}

function addFavorite(userId, song) {
  const all = readAll();
  if (!all[userId]) all[userId] = [];

  const exists = all[userId].some(s => s.url === song.url);
  if (exists) return false;

  all[userId].push(song);
  writeAll(all);
  return true;
}

function removeFavorite(userId, index) {
  const all = readAll();
  if (!all[userId] || !all[userId][index]) return null;

  const [removed] = all[userId].splice(index, 1);
  writeAll(all);
  return removed;
}

module.exports = { getFavorites, addFavorite, removeFavorite };
