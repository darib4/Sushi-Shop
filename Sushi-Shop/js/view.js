const list = document.getElementById("cart-list");
const totalSpan = document.getElementById("total");

function renderCart() {
  const cart = getCart();
  list.innerHTML = "";
  let total = 0;

  cart.forEach(p => {
    total += p.price * p.quantity;

    const li = document.createElement("li");
    li.innerHTML = `
      ${p.name} x ${p.quantity}
      <button onclick="changeQty(${p.id}, 1)">+</button>
      <button onclick="changeQty(${p.id}, -1)">-</button>
      <button onclick="removeItem(${p.id})">Remove</button>
    `;
    list.appendChild(li);
  });

  totalSpan.textContent = total.toFixed(2);
}

function changeQty(id, delta) {
  let cart = getCart();
  const item = cart.find(p => p.id === id);
  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  let cart = getCart().filter(p => p.id !== id);
  saveCart(cart);
  renderCart();
}

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
});
