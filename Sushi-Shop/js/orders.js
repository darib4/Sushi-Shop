// orders.js (Stage 3)
// Implements a simple "order processing pipeline":
// 1) create order
// 2) authorize card (simulated)
// 3) check stock + reserve
// 4) prepare
// 5) ship
// 6) deliver
// Also writes simulated emails + transactions to localStorage.

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function _getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

function _loadProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function _saveProducts(products) {
  localStorage.setItem("products", JSON.stringify(products));
}

function _loadOrders() {
  return JSON.parse(localStorage.getItem("orders")) || [];
}

function _saveOrders(orders) {
  localStorage.setItem("orders", JSON.stringify(orders));
}

function _loadTransactions() {
  return JSON.parse(localStorage.getItem("transactions")) || [];
}

function _saveTransactions(txs) {
  localStorage.setItem("transactions", JSON.stringify(txs));
}

function _loadEmails() {
  return JSON.parse(localStorage.getItem("emails")) || [];
}

function _saveEmails(emails) {
  localStorage.setItem("emails", JSON.stringify(emails));
}

function _maskCard(cardNumber) {
  const digits = String(cardNumber).replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");
  return `**** **** **** ${last4}`;
}

function _addEmail(to, subject, body) {
  const emails = _loadEmails();
  emails.unshift({
    id: Date.now(),
    to,
    subject,
    body,
    date: new Date().toLocaleString()
  });
  _saveEmails(emails);
}

function _addTransaction(tx) {
  const txs = _loadTransactions();
  txs.unshift(tx);
  _saveTransactions(txs);
}

function _createOrder(cart, delivery, user) {
  const total = cart.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const order = {
    id: Date.now(),
    userId: user.id,
    userEmail: user.email,
    items: cart,
    total: Number(total.toFixed(2)),
    delivery,
    status: "CREATED",
    statusHistory: [{ status: "CREATED", at: new Date().toLocaleString() }],
    date: new Date().toLocaleString()
  };

  const orders = _loadOrders();
  orders.unshift(order);
  _saveOrders(orders);
  return order;
}

function _setOrderStatus(orderId, status) {
  const orders = _loadOrders();
  const o = orders.find(x => x.id === orderId);
  if (!o) return null;
  o.status = status;
  o.statusHistory = o.statusHistory || [];
  o.statusHistory.unshift({ status, at: new Date().toLocaleString() });
  _saveOrders(orders);
  return o;
}

function _authorizeCard({ cardNumber, exp, cvv }, amount, userEmail) {
  // Demo rules:
  // - must be 16 digits
  // - cvv 3 digits
  // - if card ends with 0000 -> force decline (so you can test error path)
  const digits = String(cardNumber).replace(/\D/g, "");
  const cvvDigits = String(cvv).replace(/\D/g, "");

  const approved =
    digits.length === 16 &&
    cvvDigits.length === 3 &&
    !digits.endsWith("0000") &&
    Number(amount) > 0;

  const tx = {
    id: Date.now(),
    type: "CARD_AUTH",
    userEmail,
    amount: Number(amount.toFixed(2)),
    card: _maskCard(digits),
    exp,
    status: approved ? "APPROVED" : "DECLINED",
    date: new Date().toLocaleString()
  };
  _addTransaction(tx);

  return { approved, tx };
}

function _checkAndReserveStock(cart) {
  const products = _loadProducts();

  // 1) Check availability
  for (const item of cart) {
    const p = products.find(x => x.id === item.id);
    if (!p) {
      return { ok: false, reason: `Missing product: ${item.name}` };
    }
    const stock = Number(p.stock || 0);
    if (stock < item.quantity) {
      return { ok: false, reason: `Not enough stock for: ${item.name} (left: ${stock})` };
    }
  }

  // 2) Reserve (decrement)
  for (const item of cart) {
    const p = products.find(x => x.id === item.id);
    p.stock = Number(p.stock || 0) - item.quantity;
  }

  _saveProducts(products);
  return { ok: true };
}

// Public API used by checkout.js
async function processOrder({ card, delivery, onStep }) {
  const user = _getCurrentUser();
  if (!user) {
    showToast("Please login first", "warning");
    window.location.href = "login.html";
    return;
  }

  const cart = getCart();
  if (!cart.length) {
    showToast("Cart is empty", "warning");
    window.location.href = "cart.html";
    return;
  }

  const step = async (name, fn) => {
    if (onStep) onStep(name);
    await _sleep(500);
    return fn();
  };

  // 1) Create
  const order = await step("Order created", () => _createOrder(cart, delivery, user));

  try {
    // 2) Card auth
    await step("Authorizing card", () => {
      const result = _authorizeCard(card, order.total, user.email);
      if (!result.approved) throw new Error("Card authorization declined");
      _setOrderStatus(order.id, "PAYMENT_AUTHORIZED");
    });

    // 3) Stock check + reserve
    await step("Checking stock", () => {
      const result = _checkAndReserveStock(cart);
      if (!result.ok) throw new Error(result.reason);
      _setOrderStatus(order.id, "STOCK_RESERVED");
    });

    // 4) Prepare
    await step("Preparing order", () => _setOrderStatus(order.id, "PREPARING"));
    await _sleep(800);

    // 5) Ship
    await step("Out for delivery", () => _setOrderStatus(order.id, "OUT_FOR_DELIVERY"));
    await _sleep(800);

    // 6) Delivered
    await step("Delivered", () => _setOrderStatus(order.id, "DELIVERED"));

    // Simulated email
    _addEmail(
      user.email,
      `Your order #${order.id} is delivered ✅`,
      `Thanks for shopping! Total: ${order.total} BGN\nStatus: DELIVERED\n\nYou can view details in Account → Orders.`
    );

    // Clear cart
    localStorage.removeItem("cart");
    if (typeof updateCartBadge === 'function') {
      updateCartBadge();
    }

    return { ok: true, orderId: order.id };
  } catch (err) {
    _setOrderStatus(order.id, "FAILED");
    _addEmail(
      user.email,
      `Problem with order #${order.id} ❌`,
      `We couldn't finish your order. Reason: ${err.message}`
    );
    return { ok: false, orderId: order.id, error: err.message };
  }
}

// Backward compatibility (Stage 2 button)
function placeOrder() {
  window.location.href = "checkout.html";
}
