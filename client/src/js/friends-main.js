import authManager from './core/auth-manager.js';
import friendManager from './core/friend-manager.js';
import { isConfigured } from './core/firebase-config.js';

async function init() {
  const transition = document.getElementById('transition');
  transition.classList.add('active');
  requestAnimationFrame(() => transition.classList.remove('active'));

  if (!isConfigured) {
    document.getElementById('offline-msg').classList.remove('hidden');
    document.getElementById('btn-back').addEventListener('click', () => {
      window.location.href = './index.html';
    });
    return;
  }

  // Generate and show friend code
  const code = await friendManager.ensureFriendCode();
  document.getElementById('my-code').textContent = code;

  // Copy button
  document.getElementById('btn-copy-code').addEventListener('click', () => {
    navigator.clipboard.writeText(code).then(() => {
      document.getElementById('btn-copy-code').textContent = 'Copied!';
      setTimeout(() => {
        document.getElementById('btn-copy-code').textContent = 'Copy';
      }, 2000);
    });
  });

  // Add friend
  document.getElementById('btn-add-friend').addEventListener('click', async () => {
    const input = document.getElementById('friend-code-input');
    const resultEl = document.getElementById('add-result');
    const val = input.value.trim().toUpperCase();
    if (!val || val.length < 4) {
      resultEl.textContent = 'Enter a valid code';
      resultEl.style.color = '#ff4444';
      return;
    }

    const result = await friendManager.addFriend(val);
    if (result.success) {
      resultEl.textContent = 'Friend added!';
      resultEl.style.color = '#00ff88';
      input.value = '';
      await loadFriendList();
    } else {
      resultEl.textContent = result.error;
      resultEl.style.color = '#ff4444';
    }
    setTimeout(() => { resultEl.textContent = ''; }, 3000);
  });

  // Load friends
  await loadFriendList();

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    transition.classList.add('active');
    setTimeout(() => { window.location.href = './index.html'; }, 300);
  });
}

async function loadFriendList() {
  const listEl = document.getElementById('friend-list');
  const countEl = document.getElementById('friend-count');
  const noFriends = document.getElementById('no-friends');

  const friends = await friendManager.getFriendProfiles();
  countEl.textContent = friends.length;

  if (friends.length === 0) {
    noFriends.classList.remove('hidden');
    return;
  }

  noFriends.classList.add('hidden');
  // Clear existing friend rows (keep noFriends element)
  listEl.querySelectorAll('.friend-row').forEach(el => el.remove());

  friends.forEach(friend => {
    const row = document.createElement('div');
    row.className = 'friend-row';

    const topScore = Math.max(0, ...Object.values(friend.highScores || {}));

    row.innerHTML = `
      <span class="friend-status ${friend.isOnline ? 'online' : ''}"></span>
      <span class="friend-name">${escapeHtml(friend.displayName)}</span>
      <span class="friend-level">Lv.${friend.level}</span>
      <span class="friend-score">${topScore}</span>
      <button class="btn-remove" data-uid="${friend.uid}">x</button>
    `;

    row.querySelector('.btn-remove').addEventListener('click', async () => {
      await friendManager.removeFriend(friend.uid);
      await loadFriendList();
    });

    listEl.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let initialized = false;
authManager.waitReady().then(() => {
  const safeInit = () => { if (!initialized) { initialized = true; init(); } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
});
