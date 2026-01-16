# 🚀 Quick Start

## One-Time Setup

```bash
# 1. Get Stripe keys from: https://dashboard.stripe.com/apikeys
# (Use sk_test_ key for testing)

# 2. Setup backend
cd stripe-backend
npm install
cp .env.example .env
# Edit .env and add your STRIPE_SECRET_KEY

# 3. Start backend
npm start
# Output: 🚀 Stripe backend server running on http://localhost:4242
```

## Running (Every Time)

### Terminal 1: Backend
```bash
cd stripe-backend
npm start
```

### Terminal 2: Frontend
Use **one** of these methods:

**Option A: VS Code Live Server (Recommended)**
- Right-click `pages/index.html`
- Select "Open with Live Server"
- Opens at http://localhost:5500

**Option B: Python**
```bash
python -m http.server 5500
```

**Option C: Node.js**
```bash
npm install -g http-server
http-server -p 5500
```

## Testing Payment

1. Go to **http://localhost:5500**
2. Add sushi items to cart
3. Click **"Pay with Card (Stripe)"**
4. Use test card:
   - Number: `4242 4242 4242 4242`
   - Expiry: `12/26` (or any future date)
   - CVC: `123` (any 3 digits)
5. Complete payment
6. ✅ See success page with session ID

## Test Webhooks (Optional)

```bash
# Terminal 3: Install Stripe CLI from https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:4242/webhook

# Copy the whsec_* key
# Add to stripe-backend/.env as STRIPE_WEBHOOK_SECRET
# Restart backend

# Trigger test event:
stripe trigger checkout.session.completed

# Check backend console for: ✅ Payment successful
```

## Environment Variables (.env)

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY_HERE  (optional, for webhooks)
FRONTEND_URL=http://localhost:5500
PORT=4242
```

## File Reference

| File | Purpose |
|------|---------|
| `stripe-backend/server.js` | Express backend with Stripe integration |
| `stripe-backend/package.json` | Node.js dependencies |
| `pages/cart.html` | Cart page with "Pay with Card" button |
| `pages/success.html` | Payment confirmation page |
| `js/cart.js` | Contains `handleStripeCheckout()` function |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | `npm install` in stripe-backend, check port 4242 |
| CORS error | Ensure backend runs on 4242, FRONTEND_URL in .env is correct |
| Payment button does nothing | Check browser console, verify backend running |
| Invalid API key error | Get test key from https://dashboard.stripe.com/apikeys |

## Documentation

- **Full Setup Guide**: See `stripe-backend/SETUP_GUIDE.md`
- **Implementation Details**: See `STRIPE_IMPLEMENTATION.md` in project root
- **Stripe Docs**: https://stripe.com/docs/payments/checkout
- **Test Cards**: https://stripe.com/docs/testing#cards

---

**That's it! You're ready to test Stripe payments locally.** ✨
