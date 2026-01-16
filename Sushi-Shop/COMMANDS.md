# 🖥️ Commands Reference

Copy-paste these commands to set up and run your Stripe integration.

---

## ⚙️ One-Time Setup

### 1. Navigate to backend folder
```bash
cd stripe-backend
```

### 2. Install dependencies
```bash
npm install
```

Expected output: `added 50+ packages` (may vary)

### 3. Create .env file from template
```bash
cp .env.example .env
```

### 4. Edit .env file
Open the `.env` file with your editor and add your Stripe keys:

```bash
# Windows (Notepad)
notepad .env

# macOS/Linux (nano)
nano .env

# Or open in VS Code
code .env
```

Add your keys:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY_HERE
FRONTEND_URL=http://localhost:5500
PORT=4242
```

Get keys from: https://dashboard.stripe.com/apikeys

---

## 🚀 Running the Project (Every Time)

### Terminal 1: Start Backend Server

```bash
cd stripe-backend
npm start
```

Expected output:
```
🚀 Stripe backend server running on http://localhost:4242
📍 Webhook endpoint: http://localhost:4242/webhook
✅ CORS enabled for: http://localhost:5500
```

### Terminal 2: Start Frontend (Pick ONE)

**Option A: VS Code Live Server (Easiest)**
- Right-click `pages/index.html` in VS Code
- Select "Open with Live Server"
- Auto-opens at http://localhost:5500

**Option B: Python**
```bash
cd ..
python -m http.server 5500
```

**Option C: Node.js http-server**
```bash
cd ..
npm install -g http-server
http-server -p 5500
```

---

## 🧪 Testing Payment

### Step 1: Visit the app
```
http://localhost:5500
```

### Step 2: Add to cart
- Click items to add to cart
- Cart count updates in header

### Step 3: Go to cart
- Click cart icon in header
- OR navigate directly: http://localhost:5500/pages/cart.html

### Step 4: Click "Pay with Card (Stripe)"
- New button added next to "Proceed to Checkout (Demo)"

### Step 5: Enter test card
- Card: `4242 4242 4242 4242`
- Expiry: `12/26` (or any future date)
- CVC: `123` (any 3 digits)
- Click "Pay"

### Step 6: Verify success
- You should see success page
- URL contains: `session_id=cs_test_...`
- Cart is cleared automatically

---

## 🔔 Testing Webhooks (Optional)

### Step 1: Install Stripe CLI

**Windows:**
```bash
# Download from: https://github.com/stripe/stripe-cli/releases
# Download: stripe_cli_1.17.1_windows_x86_64.msi
# Run installer

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

### Step 2: Login to Stripe
```bash
stripe login
# Opens browser, click "Allow" to authorize
```

### Step 3: Start webhook listener (Terminal 3)
```bash
stripe listen --forward-to localhost:4242/webhook
```

Output:
```
> Ready! Your webhook signing secret is: whsec_test_abc123xyz...
```

### Step 4: Copy webhook secret
Update your `stripe-backend/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_test_abc123xyz...
```

### Step 5: Restart backend (Terminal 1)
```bash
# Press Ctrl+C to stop
# Then restart:
npm start
```

### Step 6: Trigger test event
```bash
# In another terminal (Terminal 4):
stripe trigger checkout.session.completed
```

Check Terminal 1 (backend) - you should see:
```
✅ Payment successful - Session ID: cs_test_...
   Amount: XX.XX BGN
   Customer Email: Not provided
```

---

## 🔧 Useful Commands

### Check if backend is running
```bash
curl http://localhost:4242/health
# Response: {"status":"OK"}
```

### Test checkout endpoint
```bash
curl -X POST http://localhost:4242/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{
    "cart": [{
      "id": "test_item",
      "name": "Test Sushi",
      "price": 10.00,
      "quantity": 1
    }]
  }'

# Response: {"url":"https://checkout.stripe.com/..."}
```

### View backend logs in real-time
```bash
# Already displayed when running:
npm start

# On Windows, you can also:
# Just watch the terminal window where npm start is running
```

### Stop backend server
```bash
# Press Ctrl+C in the terminal running npm start
```

### Clear node_modules and reinstall (if issues)
```bash
cd stripe-backend
rm -r node_modules
rm package-lock.json
npm install
```

---

## 🐛 Debugging Commands

### Check Node.js is installed
```bash
node --version
npm --version
```

### Check if ports are in use
**Windows:**
```powershell
netstat -ano | findstr :4242
netstat -ano | findstr :5500
```

**macOS/Linux:**
```bash
lsof -i :4242
lsof -i :5500
```

### View .env file contents (verify keys are there)
```bash
cd stripe-backend
cat .env  # macOS/Linux
type .env # Windows
```

### Check Stripe keys format
- Secret key should start with: `sk_test_` (test) or `sk_live_` (production)
- Webhook secret should start with: `whsec_test_` (test) or `whsec_` (production)

---

## 📦 Reinstalling Dependencies

If you get module errors:

```bash
cd stripe-backend

# Option 1: Clean reinstall
rm -r node_modules
rm package-lock.json
npm install

# Option 2: Just reinstall
npm install

# Option 3: Install specific package
npm install express
npm install stripe
npm install dotenv
npm install cors
```

---

## 🚢 Production Deployment

### Before going live, run:

```bash
# 1. Switch to production keys in .env
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
FRONTEND_URL=https://yourdomain.com

# 2. Test payment with production keys (optional, will charge real card)
npm start

# 3. Deploy backend to server (example with Heroku)
npm install -g heroku-cli
heroku login
heroku create your-app-name
git push heroku main

# 4. Set environment variables on server:
heroku config:set STRIPE_SECRET_KEY=sk_live_...
heroku config:set STRIPE_WEBHOOK_SECRET=whsec_...
heroku config:set FRONTEND_URL=https://yourdomain.com

# 5. Create webhook in Stripe Dashboard
# Go to: https://dashboard.stripe.com/webhooks
# Add endpoint: https://your-app-name.herokuapp.com/webhook
# Copy signing secret and add to Heroku config
```

---

## 🔒 Security Checklist

Before deploying:

```bash
# 1. Make sure .env is in .gitignore
cat .gitignore | grep .env

# 2. Don't commit .env!
git status  # Should NOT show .env

# 3. Use production keys (sk_live_)
grep STRIPE_SECRET_KEY stripe-backend/.env | grep sk_live_

# 4. Set FRONTEND_URL to production domain
grep FRONTEND_URL stripe-backend/.env

# 5. Enable HTTPS in production
# Check your deployment (Heroku, AWS, etc.)
```

---

## 📋 Checklist Summary

### Initial Setup (First Time)
- [ ] `cd stripe-backend`
- [ ] `npm install`
- [ ] `cp .env.example .env`
- [ ] Add keys to `.env`

### Running Locally (Every Time)
- [ ] Terminal 1: `npm start` (in stripe-backend)
- [ ] Terminal 2: Start frontend (Live Server / Python / http-server)
- [ ] Open http://localhost:5500

### Testing
- [ ] Add items to cart
- [ ] Click "Pay with Card"
- [ ] Enter test card: 4242...
- [ ] See success page

### Webhooks (Optional)
- [ ] `stripe login`
- [ ] Terminal 3: `stripe listen --forward-to localhost:4242/webhook`
- [ ] Update .env with webhook secret
- [ ] Restart backend
- [ ] Test: `stripe trigger checkout.session.completed`

### Deployment
- [ ] Switch to production keys
- [ ] Deploy backend server
- [ ] Update FRONTEND_URL
- [ ] Create production webhook
- [ ] Test payment with production setup

---

## 🆘 Common Issues & Quick Fixes

```bash
# "Cannot find module 'express'"
npm install

# "Port 4242 already in use"
# Kill process on port 4242, then:
npm start

# "Invalid API key"
# Check STRIPE_SECRET_KEY in .env starts with sk_test_
cat stripe-backend/.env

# "CORS error"
# Make sure backend is on 4242, frontend on 5500
# Check FRONTEND_URL in .env

# "Webhook not triggering"
stripe listen --forward-to localhost:4242/webhook
# Update .env with whsec_... secret
npm start

# Node modules are huge/slow
rm -r node_modules && npm install --production
```

---

That's it! Copy-paste as needed. 🚀
