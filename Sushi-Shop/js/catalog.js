const catalogDiv = document.getElementById("catalog");
const searchInput = document.getElementById("search");
let currentFilter = "all";

function loadProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function renderCatalog(list) {
  catalogDiv.innerHTML = "";

  if (!list.length) {
    catalogDiv.innerHTML = "<p style='grid-column:1/-1;text-align:center;opacity:.7;padding:40px;'>No products found.</p>";
    return;
  }

  list.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="category">${p.category}</div>
      <h3>${p.name}</h3>
      <div class="details">
        <div>${p.ingredients}</div>
        <div style="margin-top:8px;">📦 ${p.weight || 'N/A'}</div>
      </div>
      <div class="price">${p.price} BGN</div>
      <button onclick='addToCart(${JSON.stringify(p)})'>🛒 Add to Cart</button>
    `;

    catalogDiv.appendChild(card);
  });
}

function applyFilters() {
  const products = loadProducts();
  let filtered = products;

  // Apply category filter
  if (currentFilter !== "all") {
    filtered = filtered.filter(p => p.department.toLowerCase() === currentFilter.toLowerCase());
  }

  // Apply search filter
  const searchValue = searchInput.value.toLowerCase();
  if (searchValue) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchValue) ||
      p.category.toLowerCase().includes(searchValue) ||
      p.ingredients.toLowerCase().includes(searchValue)
    );
  }

  renderCatalog(filtered);
}

searchInput.addEventListener("input", applyFilters);

// Filter button events
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      applyFilters();
    });
  });
});

// INIT
renderCatalog(loadProducts());
