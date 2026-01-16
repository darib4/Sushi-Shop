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

const summaryDiv = document.getElementById("summary");
const totalSpan = document.getElementById("total");
const pipelineOl = document.getElementById("pipeline");
const form = document.getElementById("checkout-form");

function renderSummary() {
  const cart = getCart();
  if (!cart.length) {
    summaryDiv.innerHTML = "<p>Your cart is empty.</p>";
    totalSpan.textContent = "0.00";
    return;
  }

  let total = 0;
  summaryDiv.innerHTML = "<ul class='summary-list'></ul>";
  const ul = summaryDiv.querySelector("ul");

  cart.forEach(item => {
    const line = Number(item.price) * item.quantity;
    total += line;
    const li = document.createElement("li");
    li.textContent = `${item.name} x${item.quantity} — ${line.toFixed(2)} BGN`;
    ul.appendChild(li);
  });

  totalSpan.textContent = total.toFixed(2);
}

function addPipelineStep(text) {
  const li = document.createElement("li");
  li.textContent = text;
  pipelineOl.prepend(li);
}

renderSummary();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) {
    showToast("Please login first", "warning");
    window.location.href = "login.html";
    return;
  }

  pipelineOl.innerHTML = "";
  addPipelineStep("Starting...");

  const delivery = {
    fullName: form.fullName.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    note: form.note.value.trim()
  };

  const card = {
    cardNumber: form.cardNumber.value.trim(),
    exp: form.exp.value.trim(),
    cvv: form.cvv.value.trim()
  };

  form.querySelector("button[type='submit']").disabled = true;

  const result = await processOrder({
    card,
    delivery,
    onStep: (name) => addPipelineStep(name)
  });

  form.querySelector("button[type='submit']").disabled = false;

  if (result.ok) {
    showToast(`Order placed! #${result.orderId}`, "success");
    setTimeout(() => {
      window.location.href = "account.html";
    }, 1500);
  } else {
    showToast(`Order failed: ${result.error}`, "error");
  }
});
