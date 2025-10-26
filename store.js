// store.js
// Shared localStorage helpers for users, coins, vip, redeem codes.
// Include this with <script src="store.js"></script> on pages that need coin logic.

// Owner accounts
const OWNERS = ['Airulmsyah','AMS','Ams09'];

// Helpers
function getAccounts() {
  return JSON.parse(localStorage.getItem('accounts') || '[]');
}
function saveAccounts(accounts) {
  localStorage.setItem('accounts', JSON.stringify(accounts));
}
function getUser(username) {
  const a = getAccounts();
  return a.find(u => u.username === username) || null;
}
function updateUser(updatedUser) {
  const a = getAccounts();
  const i = a.findIndex(u => u.username === updatedUser.username);
  if (i >= 0) { a[i] = updatedUser; saveAccounts(a); return true; }
  return false;
}
function getCurrentUser() {
  const u = localStorage.getItem('loggedInUser');
  if(!u) return null;
  return getUser(u);
}
function ensureUserFields(user) {
  // ensures user object has expected fields
  if (!user) return null;
  if (typeof user.coins !== 'number') user.coins = 0;
  if (!user.vip) user.vip = null; // { type: '1M'|'6M'|'1Y'|'ET', expires: ISOstring|null, active: true/false }
  if (!user.friends) user.friends = [];
  if (typeof user.banned === 'undefined') user.banned = false;
  return user;
}

// Redeem codes map: { CODE: value }
function getRedeemCodes() {
  return JSON.parse(localStorage.getItem('redeemCodes') || '{}');
}
function saveRedeemCodes(obj) {
  localStorage.setItem('redeemCodes', JSON.stringify(obj));
}
function addRedeemCode(code, value) {
  const codes = getRedeemCodes();
  codes[code] = Number(value);
  saveRedeemCodes(codes);
}
function removeRedeemCode(code) {
  const codes = getRedeemCodes();
  delete codes[code];
  saveRedeemCodes(codes);
}

// Redeem usage tracking per user: localStorage key 'redeemUsed_<username>' -> { CODE: true }
function getRedeemUsed(username) {
  return JSON.parse(localStorage.getItem('redeemUsed_' + username) || '{}');
}
function setRedeemUsed(username, code) {
  const u = getRedeemUsed(username);
  u[code] = true;
  localStorage.setItem('redeemUsed_' + username, JSON.stringify(u));
}

// Coin operations
function addCoinsToUser(username, amount) {
  const accounts = getAccounts();
  const i = accounts.findIndex(a => a.username === username);
  if (i === -1) return false;
  accounts[i].coins = (Number(accounts[i].coins) || 0) + Number(amount);
  saveAccounts(accounts);
  return true;
}
function deductCoinsFromUser(username, amount) {
  const accounts = getAccounts();
  const i = accounts.findIndex(a => a.username === username);
  if (i === -1) return false;
  if ((Number(accounts[i].coins) || 0) < Number(amount)) return false;
  accounts[i].coins = (Number(accounts[i].coins) || 0) - Number(amount);
  saveAccounts(accounts);
  return true;
}

// VIP helpers
// types: '1M' (30), '6M'(60), '1Y'(120), 'ET'(350)
function buyVIP(username, type) {
  const user = ensureUserFields(getUser(username));
  if (!user) return { ok:false, msg:'User not found' };
  const costs = { '1M':30, '6M':60, '1Y':120, 'ET':350 };
  const months = { '1M':1, '6M':6, '1Y':12, 'ET':0 }; // 0 for forever
  const cost = costs[type];
  if (typeof cost === 'undefined') return { ok:false, msg:'Invalid VIP type' };
  if ((user.coins || 0) < cost) return { ok:false, msg:'Not enough coins' };
  // deduct
  user.coins = (user.coins || 0) - cost;
  if (type === 'ET') {
    user.vip = { type:'ET', expires:null, active:true };
  } else {
    const now = new Date();
    const future = new Date(now.setMonth(now.getMonth() + months[type]));
    user.vip = { type:type, expires: future.toISOString(), active:true };
  }
  updateUser(user);
  return { ok:true, user };
}
function toggleEternalVIP(username, active) {
  const user = ensureUserFields(getUser(username));
  if (!user) return false;
  if (!user.vip || user.vip.type !== 'ET') return false;
  user.vip.active = !!active;
  updateUser(user);
  return true;
}
function revokeVIP(username) {
  const user = ensureUserFields(getUser(username));
  if (!user) return false;
  user.vip = null;
  updateUser(user);
  return true;
}

// Owner check
function isOwner(username) {
  return OWNERS.includes(username);
}

// Game deletion helper (delete all games by a username)
function deleteGamesByUser(username) {
  const games = JSON.parse(localStorage.getItem('games') || '[]');
  const filtered = games.filter(g => g.creator !== username);
  localStorage.setItem('games', JSON.stringify(filtered));
}

// initialize redeemCodes if not exists (example seeds for owners to use)
(function seedRedeem(){
  const codes = getRedeemCodes();
  // only seed if empty
  if(Object.keys(codes).length === 0) {
    // example seeds (owners can add more later)
    codes['WELCOME50'] = 50;
    codes['FREE10'] = 10;
    saveRedeemCodes(codes);
  }
})();
