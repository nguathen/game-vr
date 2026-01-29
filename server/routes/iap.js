import { Router } from 'express';
import { addPurchase, getPurchase, updatePurchaseByStripeSession } from '../db/database.js';

const router = Router();

const VALID_PRODUCT_IDS = new Set(['coin_pack_100', 'coin_pack_500', 'premium_unlock']);

const products = [
  { id: 'coin_pack_100', name: '100 Coins', price: 0.99, priceCents: 99, type: 'consumable', coinAmount: 100 },
  { id: 'coin_pack_500', name: '500 Coins', price: 3.99, priceCents: 399, type: 'consumable', coinAmount: 500 },
  { id: 'premium_unlock', name: 'Premium', price: 4.99, priceCents: 499, type: 'non_consumable' },
];

// GET /api/products
router.get('/products', (_req, res) => {
  res.json(products.map(({ priceCents, ...p }) => p));
});

// POST /api/checkout
router.post('/checkout', async (req, res) => {
  const { productId } = req.body;

  if (!productId || typeof productId !== 'string' || !VALID_PRODUCT_IDS.has(productId)) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  const product = products.find(p => p.id === productId);
  const sessionId = crypto.randomUUID();

  // Stripe mode: create real checkout session
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && !stripeKey.includes('xxx')) {
    try {
      const stripe = (await import('stripe')).default(stripeKey);
      const origin = req.headers.origin || `http://localhost:${process.env.PORT || 3001}`;

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: product.name },
            unit_amount: product.priceCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${origin}/shop.html?success=true&session=${sessionId}`,
        cancel_url: `${origin}/shop.html?canceled=true`,
        metadata: { sessionId, productId },
      });

      addPurchase({
        session_id: sessionId,
        product_id: productId,
        stripe_session: checkoutSession.id,
        status: 'pending',
      });

      return res.json({ url: checkoutSession.url, sessionId });
    } catch (err) {
      console.error('[IAP] Stripe checkout error:', err.message);
      return res.status(500).json({ error: 'Payment service unavailable' });
    }
  }

  // Dev mode: simulate successful purchase
  addPurchase({ session_id: sessionId, product_id: productId, status: 'completed' });
  console.log(`[IAP] Dev purchase: ${productId} (session: ${sessionId})`);

  res.json({ success: true, sessionId, product: productId });
});

// POST /api/webhook — Stripe webhook
router.post('/webhook', (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.includes('xxx')) {
    return res.status(400).json({ error: 'Webhook not configured' });
  }

  let event;
  try {
    const stripe = (async () => (await import('stripe')).default(process.env.STRIPE_SECRET_KEY))();
    // Note: in production, verify signature with stripe.webhooks.constructEvent
    // For now, parse raw body
    event = JSON.parse(req.body.toString());
  } catch (err) {
    console.error('[IAP] Webhook parse error:', err.message);
    return res.status(400).json({ error: 'Invalid payload' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const stripeSessionId = session.id;

    const purchase = updatePurchaseByStripeSession(stripeSessionId, 'completed');
    if (purchase) {
      console.log(`[IAP] Webhook: purchase completed for ${purchase.product_id}`);
    } else {
      console.warn(`[IAP] Webhook: no purchase found for stripe session ${stripeSessionId}`);
    }
  }

  res.json({ received: true });
});

// GET /api/purchases/:sessionId
router.get('/purchases/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  // Basic validation: UUID format
  if (!/^[0-9a-f-]{36}$/i.test(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  const row = getPurchase(sessionId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

export { router as iapRouter };
