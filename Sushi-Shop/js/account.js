// Toast helper function
function showToast(message, type = "info") {
  const typeColors = {
    success: "#22c55e",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6"
  };

  if (typeof Toastify !== 'undefined') {
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
  } else {
    alert(message);
  }
}

const userInfoDiv = document.getElementById("user-info");
const ordersDiv = document.getElementById("orders");
const emailsDiv = document.getElementById("emails");
const txDiv = document.getElementById("transactions");

function loadOrders() {
  return JSON.parse(localStorage.getItem("orders")) || [];
}

function loadEmails() {
  return JSON.parse(localStorage.getItem("emails")) || [];
}

function loadTransactions() {
  return JSON.parse(localStorage.getItem("transactions")) || [];
}

function requireLogin() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    showToast("Please login first", "warning");
    window.location.href = "login.html";
    return null;
  }
  return user;
}

function renderUser(user) {
  userInfoDiv.innerHTML = `
    <p><strong>Username:</strong> ${user.username}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>
    <p class="hint">Admin demo login: admin@sushi.bg / admin123</p>
  `;
}

function renderOrders(user) {
  const orders = loadOrders().filter(o => o.userId === user.id);
  if (!orders.length) {
    ordersDiv.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  ordersDiv.innerHTML = "";
  orders.forEach(o => {
    const box = document.createElement("div");
    box.className = "order";
    box.innerHTML = `
      <div class="row">
        <div>
          <strong>#${o.id}</strong>
          <span class="muted">(${o.date})</span>
        </div>
        <div class="status">${o.status}</div>
      </div>
      <div class="items">
        ${o.items.map(i => `<div>• ${i.name} x${i.quantity}</div>`).join("")}
      </div>
      <div class="row">
        <div><strong>Total:</strong> ${Number(o.total).toFixed(2)} BGN</div>
        <button class="small" data-id="${o.id}">Show history</button>
      </div>
      <div class="history" id="h-${o.id}" style="display:none"></div>
    `;
    ordersDiv.appendChild(box);

    box.querySelector("button").addEventListener("click", () => {
      const hist = box.querySelector(`#h-${o.id}`);
      const open = hist.style.display !== "none";
      hist.style.display = open ? "none" : "block";
      hist.innerHTML = (o.statusHistory || [])
        .map(s => `<div>• ${s.status} — <span class="muted">${s.at}</span></div>`)
        .join("") || "<div>No history</div>";
    });
  });
}

function renderEmails(user) {
  const emails = loadEmails().filter(e => e.to === user.email);
  if (!emails.length) {
    emailsDiv.innerHTML = "<p>No emails.</p>";
    return;
  }
  emailsDiv.innerHTML = "";
  emails.slice(0, 10).forEach(e => {
    const box = document.createElement("div");
    box.className = "email";
    box.innerHTML = `
      <div class="row">
        <strong>${e.subject}</strong>
        <span class="muted">${e.date}</span>
      </div>
      <pre>${e.body}</pre>
    `;
    emailsDiv.appendChild(box);
  });
}

function renderTransactions(user) {
  const txs = loadTransactions().filter(t => t.userEmail === user.email);
  if (!txs.length) {
    txDiv.innerHTML = "<p>No transactions.</p>";
    return;
  }
  txDiv.innerHTML = "";
  txs.slice(0, 10).forEach(t => {
    const box = document.createElement("div");
    box.className = "tx";
    box.innerHTML = `
      <div class="row">
        <div><strong>${t.type}</strong> — ${t.status}</div>
        <span class="muted">${t.date}</span>
      </div>
      <div class="muted">${t.card} · ${Number(t.amount).toFixed(2)} BGN · exp ${t.exp}</div>
    `;
    txDiv.appendChild(box);
  });
}

const user = requireLogin();
if (user) {
  renderUser(user);
  renderOrders(user);
  renderEmails(user);
  renderTransactions(user);
}
