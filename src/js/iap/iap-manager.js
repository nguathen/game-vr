import authManager from '../core/auth-manager.js';
import { products } from './iap-products.js';

const META_BILLING_URL = 'https://store.meta.com/billing';

class IAPManager {
  constructor() {
    this._products = products;
    this._service = null;
    this._devMode = false;
    this._ready = false;
  }

  get products() { return this._products; }
  get devMode() { return this._devMode; }
  get ready() { return this._ready; }

  async init() {
    try {
      if (!window.getDigitalGoodsService) {
        throw new Error('Digital Goods API not available');
      }
      this._service = await window.getDigitalGoodsService(META_BILLING_URL);
      console.log('[IAPManager] Digital Goods API connected');

      await this._restoreEntitlements();
      await this._fetchPrices();
    } catch (err) {
      console.warn('[IAPManager] Falling back to dev mode:', err.message);
      this._devMode = true;
    }

    this._ready = true;
  }

  async _fetchPrices() {
    if (!this._service) return;

    const skus = this._products.map(p => p.sku);
    try {
      const details = await this._service.getDetails(skus);
      for (const detail of details) {
        const product = this._products.find(p => p.sku === detail.itemId);
        if (product) {
          product.metaPrice = detail.price;
          product.metaTitle = detail.title;
        }
      }
      console.log('[IAPManager] Prices fetched from Meta');
    } catch (err) {
      console.warn('[IAPManager] Failed to fetch prices:', err.message);
    }
  }

  async _restoreEntitlements() {
    if (!this._service) return;

    try {
      const purchases = await this._service.listPurchases();
      for (const purchase of purchases) {
        const product = this._products.find(p => p.sku === purchase.itemId);
        if (!product) continue;

        if (product.type === 'non_consumable') {
          await this._grantProduct(product);
          console.log(`[IAPManager] Restored entitlement: ${product.id}`);
        }
      }
    } catch (err) {
      console.warn('[IAPManager] Failed to restore entitlements:', err.message);
    }
  }

  async purchase(productId) {
    const product = this._products.find(p => p.id === productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    if (this._devMode) {
      return this._devPurchase(product);
    }

    return this._metaPurchase(product);
  }

  async _metaPurchase(product) {
    const methodData = [{
      supportedMethods: META_BILLING_URL,
      data: { sku: product.sku },
    }];

    const details = {
      total: {
        label: product.name,
        amount: { currency: 'USD', value: product.price.toString() },
      },
    };

    const request = new PaymentRequest(methodData, details);
    const response = await request.show();

    const { purchaseToken } = response.details;

    await this._grantProduct(product);

    // Consume consumables so they can be purchased again
    if (product.type === 'consumable' && this._service) {
      await this._service.consume(purchaseToken);
    }

    await response.complete('success');
    return { success: true, product };
  }

  async _devPurchase(product) {
    console.log(`[IAPManager] Dev purchase: ${product.id}`);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      if (res.ok) await res.json();
    } catch { /* dev server may not be running */ }

    await this._grantProduct(product);
    return { success: true, product, devMode: true };
  }

  async _grantProduct(product) {
    const profile = authManager.profile;
    if (!profile) return;

    if (product.type === 'consumable') {
      await authManager.saveProfile({ coins: (profile.coins || 0) + (product.coinAmount || 0) });
    } else if (product.type === 'non_consumable') {
      const list = profile.purchasedItems || [];
      if (list.includes(product.id)) return;
      const purchased = [...list, product.id];
      const updates = { purchasedItems: purchased };
      if (product.id === 'premium_unlock') updates.isPremium = true;
      await authManager.saveProfile(updates);
    }
  }

  getDisplayPrice(product) {
    if (product.metaPrice) return product.metaPrice;
    return `$${product.price.toFixed(2)}`;
  }

  isOwned(productId) {
    const list = authManager.profile?.purchasedItems || [];
    return list.includes(productId);
  }
}

const iapManager = new IAPManager();
export { iapManager };
export default iapManager;
