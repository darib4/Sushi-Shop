# 📡 API Reference

## Base URL
```
http://localhost:4242
```

---

## Endpoints

### 1. GET /health
**Health Check**

Verify the backend server is running.

**Request:**
```http
GET /health
```

**Response (200 OK):**
```json
{
  "status": "OK"
}
```

**Example:**
```bash
curl http://localhost:4242/health
```

---

### 2. POST /create-checkout-session
**Create Stripe Checkout Session**

Converts cart items to a Stripe Checkout session and returns the payment URL.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "cart": [
    {
      "id": "item_1",
      "name": "Spicy Tuna Roll",
      "price": 12.99,
      "quantity": 2
    },
    {
      "id": "item_2", 
      "name": "California Roll",
      "price": 8.50,
      "quantity": 1
    }
  ]
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `cart` | Array | Yes | Array of cart items |
| `cart[].id` | String | Yes | Unique product identifier |
| `cart[].name` | String | Yes | Product name (displayed in Stripe) |
| `cart[].price` | Number | Yes | Unit price in BGN (e.g., 12.99) |
| `cart[].quantity` | Integer | Yes | Item quantity (must be ≥ 1) |

**Response (200 OK):**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_abc123def456..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid quantity for Spicy Tuna: must be positive integer"
}
```

**Possible Errors:**

| Error | Cause |
|-------|-------|
| `Cart is empty` | No items in cart array |
| `Invalid cart item` | Missing required fields (id, name, price, quantity) |
| `Invalid quantity for X: must be positive integer` | Quantity < 1 or not an integer |
| `Invalid price for X: must be non-negative` | Price < 0 |
| `No API key provided` | STRIPE_SECRET_KEY not configured in .env |

**Frontend Example:**
```javascript
const response = await fetch("http://localhost:4242/create-checkout-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    cart: [
      { id: "item_1", name: "Spicy Tuna", price: 12.99, quantity: 2 }
    ]
  })
});

const { url } = await response.json();
window.location.href = url; // Redirect to Stripe Checkout
```

**Flow:**
1. Frontend sends cart items
2. Backend validates each item
3. Backend converts prices: `price * 100` (e.g., 12.99 → 1299 cents)
4. Backend creates Stripe session with line items
5. Backend returns checkout URL
6. Frontend redirects user to Stripe Checkout page

---

### 3. POST /webhook
**Webhook Event Handler**

Receives and processes Stripe webhook events. Requires signature verification.

**Request Headers:**
```
Content-Type: application/json
stripe-signature: t=timestamp,v1=signature_hash
```

**Request Body:**
Webhook event JSON from Stripe (raw body)

**Response (200 OK):**
```json
{
  "received": true
}
```

**Error Responses:**

| Status | Response | Cause |
|--------|----------|-------|
| 400 | `{"error": "Missing signature"}` | Missing stripe-signature header |
| 400 | `{"error": "Webhook Error: ..."}` | Invalid signature (request not from Stripe) |
| 500 | `{"error": "Server misconfiguration"}` | STRIPE_WEBHOOK_SECRET not set in .env |
| 500 | `{"error": "Webhook processing failed"}` | Error processing event data |

**Handled Events:**

#### checkout.session.completed
Triggered when payment is successfully completed.

**Console Output:**
```
✅ Payment successful - Session ID: cs_test_abc123...
   Amount: 29.48 BGN
   Customer Email: customer@example.com
```

#### checkout.session.expired
Triggered when a checkout session expires.

**Console Output:**
```
⏱️  Checkout session expired - Session ID: cs_test_abc123...
```

**Signature Verification:**

The webhook handler automatically:
1. Extracts the `stripe-signature` header
2. Uses `stripe.webhooks.constructEvent()` to verify signature
3. Uses `STRIPE_WEBHOOK_SECRET` from .env
4. Only processes verified events

**Security:**
- ✅ Signature verified against STRIPE_WEBHOOK_SECRET
- ✅ Only processes events from Stripe
- ✅ Rejects unsigned or tampered requests
- ✅ Source of truth for payment confirmation

**Setup Instructions:**

1. Get webhook signing secret from Stripe Dashboard:
   - Go to Developers → Webhooks
   - Create endpoint: `http://your-domain/webhook`
   - Copy signing secret (whsec_test_...)

2. Add to .env:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_test_your_secret...
   ```

3. Test locally with Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:4242/webhook
   ```

4. Stripe CLI will output new webhook secret - update .env

5. Trigger test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## Request/Response Examples

### Example 1: Single Item Purchase
**Request:**
```bash
curl -X POST http://localhost:4242/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [{
      "id": "spicy_tuna",
      "name": "Spicy Tuna Roll",
      "price": 9.99,
      "quantity": 1
    }]
  }'
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

### Example 2: Multiple Items
**Request:**
```bash
curl -X POST http://localhost:4242/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [
      {
        "id": "item_1",
        "name": "Spicy Tuna",
        "price": 12.99,
        "quantity": 2
      },
      {
        "id": "item_2",
        "name": "California Roll",
        "price": 8.50,
        "quantity": 1
      },
      {
        "id": "item_3",
        "name": "Dragon Roll",
        "price": 14.00,
        "quantity": 1
      }
    ]
  }'
```

**Total: (12.99 × 2) + 8.50 + 14.00 = 47.48 BGN**

### Example 3: Invalid Cart (Error)
**Request:**
```bash
curl -X POST http://localhost:4242/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [{
      "id": "item_1",
      "name": "Spicy Tuna",
      "price": 12.99,
      "quantity": 0
    }]
  }'
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid quantity for Spicy Tuna: must be positive integer"
}
```

---

## Environment Variables

| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `STRIPE_SECRET_KEY` | Yes | `sk_test_abc123...` | Stripe API authentication (secret) |
| `STRIPE_WEBHOOK_SECRET` | Optional* | `whsec_test_abc123...` | Webhook signature verification |
| `FRONTEND_URL` | Yes | `http://localhost:5500` | CORS origin, success/cancel redirect |
| `PORT` | No | `4242` | Server port (default: 4242) |

*Required only if using webhooks

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success - request processed successfully |
| 400 | Bad Request - invalid input or validation error |
| 404 | Not Found - endpoint does not exist |
| 500 | Server Error - internal error (see logs) |

---

## CORS Configuration

**Allowed Origins:**
- Configured from `FRONTEND_URL` environment variable
- Default: `http://localhost:5500`

**Allowed Methods:**
- GET
- POST

**Credentials:**
- Enabled (cookies/auth headers supported)

---

## Testing with Stripe Test Cards

Use these test card numbers in Stripe Checkout:

| Card Number | Use Case |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined (generic) |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `5555 5555 5555 4444` | Mastercard test card |

**For all test cards:**
- Expiry: Any future date (e.g., 12/26)
- CVC: Any 3 digits (e.g., 123)
- Email: Any valid email format

---

## Debugging

### Enable Logging
The backend logs all events to the console:

```javascript
// Checkout session creation
console.error('Checkout session creation error:', error.message);

// Webhook events
console.log(`✅ Payment successful - Session ID: ${session.id}`);
console.error('Webhook signature verification failed:', err.message);
console.error('Webhook processing error:', err.message);
```

### Check Backend Logs
When running `npm start`, watch for:
- `🚀 Stripe backend server running on http://localhost:4242`
- `✅ Payment successful` (after webhook)
- `Webhook signature verification failed` (signature error)

### Test Endpoints
```bash
# Health check
curl http://localhost:4242/health

# Create session (valid)
curl -X POST http://localhost:4242/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"cart":[{"id":"1","name":"Test","price":10,"quantity":1}]}'

# Create session (invalid)
curl -X POST http://localhost:4242/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"cart":[]}'
```

---

## Production Considerations

Before deploying to production:

1. **Use Production Keys**: Switch from `sk_test_*` to `sk_live_*`
2. **HTTPS**: All endpoints must use HTTPS
3. **Hostname**: Update `FRONTEND_URL` to your domain
4. **Database**: Save orders when webhook fires
5. **Email**: Send confirmation emails
6. **Error Logging**: Use production logging service
7. **Rate Limiting**: Add rate limiting to prevent abuse
8. **Retry Logic**: Implement retry for failed requests

---

For more details, see the full implementation guide in `STRIPE_IMPLEMENTATION.md` and `SETUP_GUIDE.md`.
