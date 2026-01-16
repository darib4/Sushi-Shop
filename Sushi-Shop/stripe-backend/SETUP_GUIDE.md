# Stripe Checkout Integration - Setup & Testing Guide

## 📁 Project Structure

```
Online_sushi_shop_1MI0700121 - Copy/
├── stripe-backend/           ← NEW BACKEND FOLDER
│   ├── server.js            ← Express server with Stripe endpoints
│   ├── package.json         ← Node.js dependencies
│   ├── .env.example         ← Environment variables template
│   └── .env                 ← (Create from .env.example - DO NOT commit)
├── pages/
│   ├── cart.html            ← UPDATED: Added "Pay with Card" button
│   ├── success.html         ← NEW: Payment success page
│   └── ...
├── js/
│   ├── cart.js              ← UPDATED: Added handleStripeCheckout() function
│   └── ...
└── ...
```

## 🔑 Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Navigate to **Developers > API Keys**
4. Copy your **Secret Key** (starts with `sk_test_` for test mode)
5. Keep this secret - never expose in browser or commit to git!

## ⚙️ Step 2: Configure Backend

### 2a. Install Dependencies

```bash
cd stripe-backend
npm install
```

This installs:
- **express**: Web framework
- **stripe**: Stripe Node.js SDK
- **dotenv**: Environment variable management
- **cors**: Cross-Origin Resource Sharing for frontend requests

### 2b. Create .env File

```bash
# In the stripe-backend folder:
cp .env.example .env
```

Edit `.env` and add your keys:

```
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET_HERE
FRONTEND_URL=http://localhost:5500
PORT=4242
```

⚠️ **IMPORTANT**: 
- Never commit `.env` to git
- Keep `STRIPE_SECRET_KEY` private - it can charge cards
- Use test mode keys (starting with `sk_test_`) during development

## 🚀 Step 3: Start the Backend Server

```bash
cd stripe-backend
npm start
# or: node server.js
```

Expected output:
```
🚀 Stripe backend server running on http://localhost:4242
📍 Webhook endpoint: http://localhost:4242/webhook
✅ CORS enabled for: http://localhost:5500
```

Test it's working:
```bash
curl http://localhost:4242/health
# Should return: {"status":"OK"}
```

## 🌐 Step 4: Start the Frontend

In a **new terminal**, start a local web server:

### Option A: Live Server (VS Code Extension)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"
3. Frontend runs on `http://localhost:5500`

### Option B: Python
```bash
# In project root
python -m http.server 5500
```

### Option C: Node.js http-server
```bash
npm install -g http-server
http-server -p 5500
```

## 💳 Step 5: Test the Payment Flow

### 5a. Add Items to Cart
1. Go to `http://localhost:5500` (frontend)
2. Click "Catalog" to browse sushi items
3. Add a few items to your cart
4. Click "Your Cart" to view cart

### 5b. Initiate Stripe Checkout
1. On the cart page, click **"Pay with Card (Stripe)"** button
2. You'll be redirected to Stripe's hosted checkout page

### 5c. Complete Test Payment
Use Stripe test card numbers:

| Card Number      | Expiry | CVC |
|-----------------|--------|-----|
| 4242 4242 4242 4242 | Any future date (e.g., 12/26) | Any 3 digits |

Example:
- Card: `4242 4242 4242 4242`
- Expiry: `12/26`
- CVC: `123`
- Name: Any name
- Email: Any email

3. Click **"Pay"**
4. You'll be redirected to the success page
5. See `session_id` in the URL: `http://localhost:5500/pages/success.html?session_id=cs_test_...`

### 5d. Verify in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Payments**
3. You should see your test charge with status "Succeeded"

## 🔔 Step 6: Test Webhooks (Optional but Recommended)

### Why Webhooks Matter
- The webhook is the **source of truth** for payment confirmation
- Stripe sends a `checkout.session.completed` event when payment succeeds
- Your backend logs this event in the console

### 6a. Install Stripe CLI

**Windows (PowerShell):**
```powershell
# Download the installer from:
# https://github.com/stripe/stripe-cli/releases/download/v1.17.1/stripe_cli_1.17.1_windows_x86_64.msi
# Or use Chocolatey:
choco install stripe-cli
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
curl https://files.stripe.com/stripe-cli/install.sh -s | sudo bash
```

### 6b. Login to Stripe CLI
```bash
stripe login
```
This creates a secure connection to your Stripe account.

### 6c. Forward Webhooks to Local Server
```bash
stripe listen --forward-to localhost:4242/webhook
```

This will output:
```
> Ready! Your webhook signing secret is: whsec_test_abc123...
```

### 6d. Copy Webhook Secret to .env
Update your `.env` file with the webhook secret:
```
STRIPE_WEBHOOK_SECRET=whsec_test_abc123...
```

Restart your backend server.

### 6e. Test Webhook
In another terminal, trigger a test event:
```bash
stripe trigger checkout.session.completed
```

Check your backend console - you should see:
```
✅ Payment successful - Session ID: cs_test_abc123...
   Amount: XX.XX BGN
   Customer Email: Not provided
```

## 🔒 Security Notes

### ✅ Implemented Securely
- ✅ Secret keys stay on the backend (never in browser)
- ✅ Prices are sent to backend and can be verified
- ✅ Webhook signature is verified before processing
- ✅ CORS restricts requests to your frontend URL
- ✅ Success/cancel URLs redirect to known frontend pages

### ⚠️ Production Checklist
Before going live, add:

1. **Price Verification**: In `server.js`, create a product database or price list and validate client prices against it:
```javascript
// Example: Never trust client-provided prices
const productCatalog = {
  "item_1": { name: "Spicy Tuna", price: 12.99 },
  "item_2": { name: "California Roll", price: 8.50 }
};

const verifiedPrice = productCatalog[item.id]?.price;
if (verifiedPrice !== Number(item.price)) {
  throw new Error("Price mismatch detected!");
}
```

2. **Order Persistence**: When webhook fires, save order to database:
```javascript
case 'checkout.session.completed': {
  const session = event.data.object;
  await Order.create({
    sessionId: session.id,
    customerId: session.customer_email,
    amount: session.amount_total,
    status: 'paid',
    timestamp: new Date()
  });
  break;
}
```

3. **Email Confirmation**: Send order confirmation email
4. **Logging**: Use proper logging instead of `console.log()`
5. **Error Handling**: Handle failed payments, timeouts, etc.
6. **HTTPS**: Use HTTPS in production (not just http)
7. **Environment**: Use production Stripe keys (sk_live_)

## 📝 File Summary

### New Backend Files
- **stripe-backend/server.js** (157 lines)
  - POST `/create-checkout-session` - Creates Stripe session
  - POST `/webhook` - Handles Stripe events
  
- **stripe-backend/package.json** (18 lines)
  - Dependencies: express, stripe, dotenv, cors
  - Scripts: start, dev

- **stripe-backend/.env.example** (7 lines)
  - Template for environment variables

### Updated Frontend Files
- **pages/cart.html** (Updated)
  - Added "Pay with Card (Stripe)" button

- **js/cart.js** (Updated)
  - Added `handleStripeCheckout()` function (~50 lines)
  - Calls backend to create checkout session
  - Redirects to Stripe Checkout

### New Frontend Files
- **pages/success.html** (New, 150 lines)
  - Payment success confirmation page
  - Displays session ID
  - Clears cart after successful payment

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "CORS error" | Make sure backend is running and FRONTEND_URL matches |
| "Cannot POST /create-checkout-session" | Check backend is listening on port 4242 |
| "Missing secret key" | Add STRIPE_SECRET_KEY to .env file |
| "Invalid API key" | Go to Dashboard → API Keys and copy sk_test_ key |
| "Webhook not working" | Run `stripe listen --forward-to localhost:4242/webhook` |
| Payment button disabled | Check browser console for errors, verify cart has items |
| Blank checkout page | Check FRONTEND_URL environment variable |

## 📚 Next Steps

1. Integrate order persistence (save to database)
2. Add email notifications
3. Implement refund handling
4. Add payment method management (saved cards, etc.)
5. Set up production Stripe keys
6. Deploy backend to production server (Heroku, AWS, etc.)
7. Update frontend FRONTEND_URL for production

## 🔗 Useful Links

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Node.js Stripe SDK](https://github.com/stripe/stripe-node)
- [Express.js Documentation](https://expressjs.com/)

## 📧 Support

For issues:
1. Check [Stripe Status Page](https://status.stripe.com/)
2. Review [Stripe Documentation](https://stripe.com/docs)
3. Check backend console for error messages
4. Verify all environment variables are set correctly
