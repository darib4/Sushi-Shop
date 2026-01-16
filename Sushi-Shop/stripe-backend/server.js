import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';

// CORS configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));

// Middleware: Parse JSON for all routes except webhook
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

/**
 * POST /create-checkout-session
 * Creates a Stripe Checkout session for payment processing.
 * 
 * Request body:
 * {
 *   cart: [
 *     { id: "item_1", name: "Spicy Tuna", price: 12.99, quantity: 2 },
 *     { id: "item_2", name: "California Roll", price: 8.50, quantity: 1 }
 *   ]
 * }
 * 
 * Response: { url: "https://checkout.stripe.com/..." }
 * 
 * SECURITY NOTE: In production, NEVER trust prices from the client.
 * Always calculate prices on the server using a verified product/price database.
 */
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { cart } = req.body;

    // Validate cart exists and is not empty
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Validate and convert cart items to Stripe line items
    const line_items = cart.map(item => {
      // Validate required fields
      if (!item.id || !item.name || item.price === undefined || !item.quantity) {
        throw new Error(`Invalid cart item: ${JSON.stringify(item)}`);
      }

      // Validate quantities and prices
      if (item.quantity < 1 || !Number.isInteger(item.quantity)) {
        throw new Error(`Invalid quantity for ${item.name}: must be positive integer`);
      }

      if (Number(item.price) < 0) {
        throw new Error(`Invalid price for ${item.name}: must be non-negative`);
      }

      // Convert price to cents (Stripe expects amount in smallest currency unit)
      // SECURITY: In production, fetch verified prices from your database instead
      const unit_amount = Math.round(Number(item.price) * 100);

      return {
        price_data: {
          currency: 'eur', // Euro (BGN no longer supported by Stripe)
          product_data: {
            name: item.name,
            metadata: {
              productId: item.id
            }
          },
          unit_amount
        },
        quantity: item.quantity
      };
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      success_url: `${FRONTEND_URL}/pages/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/pages/cart.html`,
      // Optional: Store order metadata for later retrieval
      metadata: {
        timestamp: new Date().toISOString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session creation error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /webhook
 * Handles Stripe webhook events.
 * 
 * SECURITY NOTES:
 * - Uses express.raw() to get raw body (required for signature verification)
 * - Verifies Stripe signature to ensure request authenticity
 * - Only processes verified events
 * - This endpoint is the source of truth for payment confirmation
 * 
 * Handled events:
 * - checkout.session.completed: Payment successful
 */
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.warn('Webhook request missing signature header');
    return res.status(400).json({ error: 'Missing signature' });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  let event;

  try {
    // Verify Stripe signature and construct event
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Process webhook events
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Payment successful - Session ID: ${session.id}`);
        console.log(`   Amount: ${(session.amount_total / 100).toFixed(2)} BGN`);
        console.log(`   Customer Email: ${session.customer_email || 'Not provided'}`);
        if (session.metadata?.orderId) {
          console.log(`   Order ID: ${session.metadata.orderId}`);
        }
        
        // TODO: In production, update database to mark order as paid
        // TODO: Send confirmation email
        // TODO: Trigger fulfillment workflow
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object;
        console.log(`⏱️  Checkout session expired - Session ID: ${session.id}`);
        // TODO: In production, clean up expired orders if needed
        break;
      }

      // Add other event handlers as needed (charge.failed, payment_intent.payment_failed, etc.)

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Stripe backend server running on http://localhost:${PORT}`);
  console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`✅ CORS enabled for: ${FRONTEND_URL}`);
  console.log('\nMake sure to:');
  console.log(`1. Copy .env.example to .env and add your Stripe keys`);
  console.log(`2. Run: npm install`);
  console.log(`\n`);
});
