// init.js
// One-time initialization for demo (localStorage "DB")

// Toast notification helper function
function showToast(message, type = "info") {
  const typeColors = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6"
  };

  // Check if Toastify is loaded
  if (typeof Toastify === 'undefined') {
    console.warn("Toastify not loaded, falling back to alert");
    alert(message);
    return;
  }

  try {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: typeColors[type] || typeColors.info,
      stopOnFocus: true,
      style: {
        borderRadius: "12px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.3)",
        fontWeight: "500",
        fontSize: "14px",
        padding: "16px 20px"
      }
    }).showToast();
  } catch (err) {
    console.error("Toast error:", err);
    alert(message);
  }
}

(function init() {
  // 1) Seed users (admin + keep existing)
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const hasAdmin = users.some(u => u.role === "admin");

  if (!hasAdmin) {
    users.push({
      id: Date.now(),
      username: "Admin",
      email: "admin@sushi.bg",
      password: "admin123", // demo only
      role: "admin"
    });
  }

  // Backfill role for old users
  for (const u of users) {
    if (!u.role) u.role = "customer";
  }
  localStorage.setItem("users", JSON.stringify(users));

  // 2) Normalize products (ensure numeric price + stock)
  const products = JSON.parse(localStorage.getItem("products")) || [];
  if (products.length) {
    for (const p of products) {
      if (typeof p.price === "string") p.price = Number(p.price);
      if (!Number.isFinite(p.price)) p.price = 0;
      if (p.stock == null) p.stock = 20;
      if (!p.department) p.department = "Sushi";
      if (!p.category) p.category = "Other";
    }
    localStorage.setItem("products", JSON.stringify(products));
  }

  // 3) Ensure collections exist
  if (!localStorage.getItem("orders")) localStorage.setItem("orders", JSON.stringify([]));
  if (!localStorage.getItem("transactions")) localStorage.setItem("transactions", JSON.stringify([]));
  if (!localStorage.getItem("emails")) localStorage.setItem("emails", JSON.stringify([]));
})();

// Update cart badge count
function updateCartBadge() {
  const badge = document.getElementById("cartBadge");
  if (badge) {
    const itemCount = state.getTotalItems();
    badge.textContent = itemCount;
    console.log("Badge updated to:", itemCount);
  }
}

// Subscribe to state changes and update badge
if (typeof state !== 'undefined') {
  state.subscribe((newState) => {
    updateCartBadge();
  });
}

// Call immediately on script load (if DOM is ready)
if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", updateCartBadge);
} else {
  updateCartBadge();
}

// Also listen for storage changes from other tabs
window.addEventListener("storage", updateCartBadge);
