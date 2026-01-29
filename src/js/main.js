import gameManager from './core/game-manager.js';

function navigateTo(url) {
  const transition = document.getElementById('transition');
  transition.classList.add('active');
  setTimeout(() => {
    window.location.href = url;
  }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
  // Fade in
  const transition = document.getElementById('transition');
  transition.classList.add('active');
  requestAnimationFrame(() => {
    transition.classList.remove('active');
  });

  // Update stats
  document.getElementById('high-score').textContent = gameManager.getHighScore();
  document.getElementById('coins-display').textContent = gameManager.getCoins();

  // Premium badge
  if (gameManager.isPremium()) {
    document.getElementById('premium-badge').classList.remove('hidden');
  }

  // Navigation
  document.getElementById('btn-play').addEventListener('click', () => {
    navigateTo('./game.html');
  });

  document.getElementById('btn-shop').addEventListener('click', () => {
    navigateTo('./shop.html');
  });
});
