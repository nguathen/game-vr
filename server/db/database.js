import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../purchases.json');

function load() {
  if (!existsSync(DB_PATH)) return { purchases: [] };
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return { purchases: [] };
  }
}

function save(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function addPurchase(purchase) {
  const data = load();
  data.purchases.push({
    ...purchase,
    id: data.purchases.length + 1,
    created_at: new Date().toISOString(),
  });
  save(data);
  return purchase;
}

export function getPurchase(sessionId) {
  const data = load();
  return data.purchases.find(p => p.session_id === sessionId) || null;
}

export function updatePurchaseByStripeSession(stripeSessionId, status) {
  const data = load();
  const purchase = data.purchases.find(p => p.stripe_session === stripeSessionId);
  if (purchase) {
    purchase.status = status;
    save(data);
  }
  return purchase;
}

export default { addPurchase, getPurchase, updatePurchaseByStripeSession };
