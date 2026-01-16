# 📊 Stripe Integration - Visual Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR SUSHI SHOP                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Browser / Frontend (Port 5500)          Backend (Port 4242)         │
│  ┌─────────────────────────────────┐    ┌───────────────────────┐   │
│  │   index.html                    │    │   server.js           │   │
│  │   ├── Catalog page              │    │   ├── Express.js      │   │
│  │   ├── Cart page ✨              │────▶│   ├── Stripe SDK      │   │
│  │   ├── SUCCESS PAGE ✨           │◀────│   └── Webhooks       │   │
│  │   └── checkout.html             │    │                       │   │
│  │                                  │    │   .env (SECURE)       │   │
│  │   js/cart.js ✨                 │    │   ├── SECRET_KEY      │   │
│  │   ├── handleStripeCheckout()    │    │   ├── WEBHOOK_SECRET  │   │
│  │   ├── POST → /create-session   │────▶│   └── FRONTEND_URL    │   │
│  │   └── Redirect to Stripe        │◀────│                       │   │
│  │                                  │    │   Endpoints:          │   │
│  └─────────────────────────────────┘    │   ✨ POST /create-session
│                                          │   ✨ POST /webhook
│                                          │   ✨ GET /health
│                                          └───────────────────────┘
│                                                    │
│                                                    │ HTTPS
│                                                    ▼
│                                          ┌───────────────────────┐
│                                          │   Stripe API          │
│                                          │   ├── Create Session  │
│                                          │   ├── Process Payment │
│                                          │   └── Send Webhook    │
│                                          └───────────────────────┘
│
└─────────────────────────────────────────────────────────────────────┘
```

---

## Payment Flow Diagram

```
START: Customer in Cart
│
├─ Cart Page Loaded
│  │
│  ├─ Shows items
│  ├─ Shows total
│  ├─ Shows "Pay with Card (Stripe)" ✨ BUTTON
│  │
│  └─ Customer clicks button
│     │
│     ▼
│  handleStripeCheckout() ✨ (Frontend)
│  │
│  ├─ Get cart from state
│  ├─ Validate cart not empty
│  ├─ Show loading toast
│  │
│  └─ POST to http://localhost:4242/create-checkout-session
│     │
│     ├─ Header: Content-Type: application/json
│     │
│     └─ Body:
│        {
│          "cart": [
│            { "id": "1", "name": "Spicy Tuna", "price": 12.99, "quantity": 2 },
│            { "id": "2", "name": "California", "price": 8.50, "quantity": 1 }
│          ]
│        }
│
▼
Backend server.js - POST /create-checkout-session ✨
│
├─ Extract cart from body
├─ Validate cart not empty ✓
├─ For each item:
│  ├─ Validate id, name, price, quantity ✓
│  ├─ Validate quantity ≥ 1 ✓
│  ├─ Validate price ≥ 0 ✓
│  └─ Convert price to cents: 12.99 → 1299 ✓
│
├─ Create line_items array
│  └─ [
│       {
│         price_data: {
│           currency: 'bgn',
│           product_data: { name: 'Spicy Tuna' },
│           unit_amount: 1299
│         },
│         quantity: 2
│       },
│       {
│         price_data: {
│           currency: 'bgn',
│           product_data: { name: 'California' },
│           unit_amount: 850
│         },
│         quantity: 1
│       }
│     ]
│
├─ Call stripe.checkout.sessions.create({
│    payment_method_types: ['card'],
│    mode: 'payment',
│    line_items,
│    success_url: 'http://localhost:5500/pages/success.html?session_id={CHECKOUT_SESSION_ID}',
│    cancel_url: 'http://localhost:5500/pages/cart.html'
│  })
│
├─ Get session from Stripe
│  └─ session.url = "https://checkout.stripe.com/pay/cs_test_..."
│
└─ Return { url: "https://checkout.stripe.com/pay/cs_test_..." }
   │
   ├─ Response 200 OK
   │
   ▼
Frontend - Receive Response
│
├─ Parse JSON
├─ Extract { url }
├─ window.location.href = url
│
▼
Stripe Checkout Page (Hosted by Stripe)
│ HTTPS URL: https://checkout.stripe.com/pay/cs_test_...
│
├─ Display order summary
│  ├─ Spicy Tuna x2 = 25.98 BGN
│  ├─ California x1 = 8.50 BGN
│  └─ Total: 34.48 BGN
│
├─ Payment form
│  ├─ Card Number field
│  ├─ Expiry field
│  ├─ CVC field
│  └─ Email field
│
├─ Customer fills form
│  ├─ Card: 4242 4242 4242 4242
│  ├─ Expiry: 12/26
│  ├─ CVC: 123
│  └─ Email: customer@example.com
│
├─ Customer clicks "Pay" button
│
├─ Stripe processes payment
│  ├─ Validate card (CVC, expiry, etc.)
│  ├─ Create transaction
│  ├─ Charge card
│  └─ Payment: SUCCESS ✅
│
├─ Send webhook event to backend
│  └─ Event type: checkout.session.completed
│
└─ Redirect customer to:
   http://localhost:5500/pages/success.html?session_id=cs_test_abc123...
   │
   ▼
   SUCCESS PAGE ✨ (New)
   │
   ├─ Display: "Payment Successful!" ✅
   ├─ Show session ID
   ├─ Clear cart from localStorage
   ├─ Show "Continue Shopping" button
   │
   └─ END: Payment Complete!

PARALLEL: Webhook Processing
│
├─ Stripe sends POST to http://localhost:4242/webhook
│
├─ Headers:
│  └─ stripe-signature: t=timestamp,v1=signature_hash
│
├─ Body: Webhook event JSON
│  └─ {
│       "type": "checkout.session.completed",
│       "data": {
│         "object": {
│           "id": "cs_test_abc123...",
│           "amount_total": 3448,
│           "customer_email": "customer@example.com",
│           "status": "complete"
│         }
│       }
│     }
│
├─ Backend: POST /webhook
│
├─ Extract signature from header
├─ Use stripe.webhooks.constructEvent()
│  ├─ Verify signature against STRIPE_WEBHOOK_SECRET
│  └─ Reject if signature invalid ✓ SECURITY
│
├─ Handle event based on type
│  └─ case 'checkout.session.completed':
│     ├─ Log: ✅ Payment successful - Session ID: cs_test_abc123...
│     ├─ Log: Amount: 34.48 BGN
│     ├─ Log: Customer Email: customer@example.com
│     │
│     ├─ TODO: Save order to database
│     ├─ TODO: Send confirmation email
│     └─ TODO: Start fulfillment workflow
│
└─ Respond: { received: true }
```

---

## File Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Frontend)                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  pages/cart.html                                                 │
│  ├─ Existing: Cart items, totals                                 │
│  └─ ✨ NEW: Button "Pay with Card (Stripe)"                     │
│                           │                                       │
│                           ▼                                       │
│  js/cart.js                                                       │
│  ├─ Existing: addToCart(), clearCart(), getCart()                │
│  └─ ✨ NEW: handleStripeCheckout()                              │
│         └─ Calls POST /create-checkout-session                  │
│            └─ Redirects to Stripe Checkout                       │
│                           │                                       │
│                           ▼                                       │
│  pages/success.html ✨ NEW                                       │
│  └─ Shows session confirmation                                   │
│     └─ Clears cart via state.clearCart()                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              NODE.js BACKEND (stripe-backend)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  server.js                                                        │
│  ├─ Express app setup                                             │
│  ├─ CORS configuration                                            │
│  ├─ JSON parsing middleware                                       │
│  │                                                                │
│  ├─ GET /health                                                   │
│  │  └─ Returns { status: "OK" }                                  │
│  │                                                                │
│  ├─ ✨ POST /create-checkout-session                             │
│  │  ├─ Validate cart items                                        │
│  │  ├─ Convert prices to cents                                    │
│  │  ├─ Call stripe.checkout.sessions.create()                    │
│  │  └─ Return { url }                                             │
│  │                                                                │
│  └─ ✨ POST /webhook                                             │
│     ├─ Extract stripe-signature header                            │
│     ├─ Verify signature                                           │
│     ├─ Handle checkout.session.completed                          │
│     └─ Log payment confirmation                                   │
│                                                                   │
│  .env (SECURE - Never committed)                                 │
│  ├─ STRIPE_SECRET_KEY=sk_test_...                                │
│  ├─ STRIPE_WEBHOOK_SECRET=whsec_test_...                         │
│  ├─ FRONTEND_URL=http://localhost:5500                           │
│  └─ PORT=4242                                                     │
│                                                                   │
│  package.json                                                     │
│  ├─ express: web framework                                        │
│  ├─ stripe: Stripe SDK                                            │
│  ├─ dotenv: environment variables                                 │
│  └─ cors: cross-origin support                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
              ┌─────────────────────────┐
              │   Stripe API            │
              │   ├── Create session    │
              │   ├── Process payment   │
              │   └── Send webhooks     │
              └─────────────────────────┘
```

---

## Security Layers

```
LAYER 1: Frontend (Browser)
┌────────────────────────────────────────────┐
│ ❌ Secret keys NOT visible                  │
│ ✅ Only calls public endpoints              │
│ ✅ Redirects to Stripe for payment          │
│ ✅ Never handles card numbers               │
└────────────────────────────────────────────┘
                    ▼
LAYER 2: CORS (Cross-Origin)
┌────────────────────────────────────────────┐
│ ✅ Requests only from http://localhost:5500 │
│ ✅ Blocks requests from other origins        │
└────────────────────────────────────────────┘
                    ▼
LAYER 3: Environment Variables
┌────────────────────────────────────────────┐
│ ✅ Secret key in .env file                  │
│ ✅ .env NOT committed to git                │
│ ✅ Only backend has access                  │
│ ✅ Never sent to browser                    │
└────────────────────────────────────────────┘
                    ▼
LAYER 4: Input Validation
┌────────────────────────────────────────────┐
│ ✅ Cart items validated                     │
│ ✅ Prices validated                         │
│ ✅ Quantities validated                     │
│ ✅ Invalid requests rejected                │
└────────────────────────────────────────────┘
                    ▼
LAYER 5: Webhook Verification
┌────────────────────────────────────────────┐
│ ✅ Stripe signature verified                │
│ ✅ Request authenticity confirmed           │
│ ✅ Only process verified events             │
│ ✅ Reject unsigned requests                 │
└────────────────────────────────────────────┘
                    ▼
LAYER 6: Stripe PCI Compliance
┌────────────────────────────────────────────┐
│ ✅ Stripe handles card data                 │
│ ✅ Your server never sees card numbers      │
│ ✅ PCI DSS Level 1 compliant                │
└────────────────────────────────────────────┘
```

---

## Data Flow - Per Transaction

```
CART STATE (Browser LocalStorage)
│
├─ Item 1: { id: "1", name: "Spicy Tuna", price: 12.99, quantity: 2 }
├─ Item 2: { id: "2", name: "California", price: 8.50, quantity: 1 }
│
▼
User clicks "Pay with Card"
│
▼
JavaScript: handleStripeCheckout()
│
├─ Prepare data:
│  {
│    "cart": [
│      { "id": "1", "name": "Spicy Tuna", "price": 12.99, "quantity": 2 },
│      { "id": "2", "name": "California", "price": 8.50, "quantity": 1 }
│    ]
│  }
│
▼
POST /create-checkout-session
│
▼
Backend Validation:
│
├─ Cart exists? ✓
├─ Items array? ✓
├─ Each item has id, name, price, quantity? ✓
├─ Quantities are integers ≥ 1? ✓
├─ Prices are non-negative? ✓
│
▼
Price Conversion:
│
├─ Item 1: 12.99 × 100 = 1299 cents
├─ Item 2: 8.50 × 100 = 850 cents
│
▼
Stripe Session Creation:
│
├─ line_items: [
│    {
│      price_data: {
│        currency: 'bgn',
│        product_data: { name: 'Spicy Tuna' },
│        unit_amount: 1299
│      },
│      quantity: 2
│    },
│    {
│      price_data: {
│        currency: 'bgn',
│        product_data: { name: 'California' },
│        unit_amount: 850
│      },
│      quantity: 1
│    }
│  ]
│
├─ success_url: http://localhost:5500/pages/success.html?session_id={CHECKOUT_SESSION_ID}
├─ cancel_url: http://localhost:5500/pages/cart.html
│
▼
Stripe API Response:
│
├─ session.id: cs_test_abc123def456xyz...
├─ session.url: https://checkout.stripe.com/pay/cs_test_abc123...
├─ session.amount_total: 3448 (34.48 BGN in cents)
│
▼
Backend Response:
│
├─ HTTP 200 OK
├─ { "url": "https://checkout.stripe.com/pay/cs_test_..." }
│
▼
Browser:
│
├─ Receive response
├─ Extract URL
├─ window.location.href = url
│
▼
Stripe Checkout Page:
│
├─ Shows: 
│  - Spicy Tuna x2 = 25.98 BGN
│  - California x1 = 8.50 BGN
│  - Total: 34.48 BGN
│
├─ Customer enters:
│  - Card: 4242 4242 4242 4242
│  - Expiry: 12/26
│  - CVC: 123
│  - Email: customer@example.com
│
▼
Stripe Processes Payment:
│
├─ Validate card
├─ Create charge
├─ Debit card account
├─ Status: SUCCESS ✅
│
▼
Stripe Actions:
│
├─ Redirect customer to success_url with session_id
├─ Send webhook event to backend
│
▼
Browser Success Page:
│
├─ URL: http://localhost:5500/pages/success.html?session_id=cs_test_abc123...
├─ Clear cart from localStorage
├─ Display: ✅ Payment Successful!
│
▼
Backend Webhook Handler:
│
├─ Event: checkout.session.completed
├─ Session: cs_test_abc123...
├─ Amount: 34.48 BGN
├─ Email: customer@example.com
├─ Status: SUCCESS ✅
│
▼
LOG: ✅ Payment successful - Session ID: cs_test_abc123...
```

---

## State Management

```
Browser LocalStorage (Existing)
│
├─ cart: [
│    { id, name, price, quantity },
│    { id, name, price, quantity }
│  ]
│
├─ currentUser: {
│    email, username, etc.
│  }
│
└─ (other state)
    │
    ▼
    handleStripeCheckout()
    │
    ├─ Reads: cart array
    ├─ Calls: backend endpoint
    │
    ▼
    Backend Creates Session
    │
    ├─ No state on backend (stateless)
    ├─ Returns: session.url
    │
    ▼
    Success Page
    │
    ├─ Calls: state.clearCart()
    ├─ Clears: cart from localStorage
    │
    ▼
    Clean State for Next Purchase
    │
    └─ cart: []
```

---

## Error Handling Flow

```
Error Point 1: Frontend - Empty Cart
│
├─ Check: if (!cart || cart.length === 0)
├─ Action: showToast("Your cart is empty")
└─ Result: User sees warning

Error Point 2: Frontend - Network Error
│
├─ Check: if (!response.ok)
├─ Extract: errorData.error
├─ Action: showToast(`Payment error: ${error.message}`)
└─ Result: User sees error, button re-enabled

Error Point 3: Backend - Invalid Cart Item
│
├─ Check: if (!item.id || !item.name || ...)
├─ Throw: Error(`Invalid cart item: ...`)
├─ Catch: err handler
├─ Response: 400 { "error": message }
└─ Result: Frontend shows error

Error Point 4: Backend - Invalid Quantity
│
├─ Check: if (quantity < 1 || !Number.isInteger(quantity))
├─ Throw: Error(`Invalid quantity for ${name}: ...`)
├─ Response: 400 { "error": message }
└─ Result: Frontend shows error

Error Point 5: Backend - Stripe API Error
│
├─ Check: stripe.checkout.sessions.create() fails
├─ Catch: error handler
├─ Response: 400 { "error": error.message }
└─ Result: Frontend shows error

Error Point 6: Webhook - Missing Signature
│
├─ Check: if (!sig)
├─ Response: 400 { "error": "Missing signature" }
└─ Result: Webhook rejected

Error Point 7: Webhook - Invalid Signature
│
├─ Check: stripe.webhooks.constructEvent() throws
├─ Catch: error handler
├─ Response: 400 { "error": "Webhook Error: ..." }
└─ Result: Webhook rejected (not from Stripe)
```

---

This is your complete visual reference! Print or bookmark these diagrams. 🎯
