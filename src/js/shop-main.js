import gameManager from './core/game-manager.js';
import iapManager from './iap/iap-manager.js';

function navigateTo(url) {
  const transition = document.getElementById('transition');
  if (transition) {
    transition.classList.add('active');
    setTimeout(() => { window.location.href = url; }, 300);
  } else {
    window.location.href = url;
  }
}

async function init() {
  const coinsEl = document.getElementById('shop-coins');
  const listEl = document.getElementById('product-list');

  coinsEl.textContent = `Coins: ${gameManager.getCoins()}`;

  // Show loading state
  listEl.textContent = 'Loading products...';

  // Initialize IAP (connects to Meta Digital Goods or falls back to dev mode)
  await iapManager.init();

  listEl.textContent = '';

  // Render products
  iapManager.products.forEach(product => {
    const item = document.createElement('div');
    item.className = 'product-item';

    const owned = product.type === 'non_consumable' && iapManager.isOwned(product.id);

    const info = document.createElement('div');
    info.className = 'product-info';

    const name = document.createElement('div');
    name.className = 'product-name';
    name.textContent = product.name;

    const desc = document.createElement('div');
    desc.className = 'product-desc';
    desc.textContent = product.description;

    info.appendChild(name);
    info.appendChild(desc);

    const priceText = iapManager.getDisplayPrice(product);

    const btn = document.createElement('button');
    btn.className = 'btn-buy';
    btn.disabled = owned;
    btn.textContent = owned ? 'Owned' : priceText;

    if (!owned) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '...';

        try {
          await iapManager.purchase(product.id);
          coinsEl.textContent = `Coins: ${gameManager.getCoins()}`;

          if (product.type === 'non_consumable') {
            btn.textContent = 'Owned';
            showNotification(`Unlocked: ${product.name}`, 'success');
          } else {
            btn.disabled = false;
            btn.textContent = priceText;
            showNotification(`+${product.coinAmount} coins!`, 'success');
          }
        } catch {
          btn.disabled = false;
          btn.textContent = priceText;
          showNotification('Purchase failed. Try again.', 'error');
        }
      });
    }

    item.appendChild(info);
    item.appendChild(btn);
    listEl.appendChild(item);
  });

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    navigateTo('./index.html');
  });
}

function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.textContent = message;
  document.body.appendChild(el);

  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
