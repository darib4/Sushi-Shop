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

const form = document.getElementById("admin-form");
const list = document.getElementById("admin-list");
const editModal = document.getElementById("edit-modal");
const editForm = document.getElementById("edit-form");
const cancelEditBtn = document.getElementById("cancel-edit");

// Simple guard: only admin can open this page
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "admin") {
  showToast("Admin access only", "error");
  window.location.href = "login.html";
}

let editingProductId = null;

function loadProducts() {
  return JSON.parse(localStorage.getItem("products")) || [];
}

function saveProducts(p) {
  localStorage.setItem("products", JSON.stringify(p));
}

function renderAdmin() {
  const products = loadProducts();
  list.innerHTML = "";

  if (products.length === 0) {
    list.innerHTML = "<p>No products yet</p>";
    return;
  }

  products.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="product-info">
        <strong>${p.name}</strong>
        <span class="product-category">${p.category}</span>
        <span class="product-price">${Number(p.price).toFixed(2)} BGN</span>
        <span class="product-stock">Stock: ${p.stock}</span>
      </div>
      <div class="product-actions">
        <button class="edit-btn" onclick="openEditModal(${p.id})">Edit</button>
        <button class="delete-btn" onclick="removeProduct(${p.id})">Delete</button>
      </div>
    `;
    list.appendChild(li);
  });
}

function openEditModal(id) {
  editingProductId = id;
  const products = loadProducts();
  const product = products.find(p => p.id === id);

  if (!product) {
    showToast("Product not found", "error");
    return;
  }

  // Populate edit form with product data
  editForm.name.value = product.name;
  editForm.department.value = product.department || "";
  editForm.category.value = product.category || "";
  editForm.price.value = product.price;
  editForm.stock.value = product.stock;
  editForm.weight.value = product.weight || "";
  editForm.ingredients.value = product.ingredients || "";

  editModal.style.display = "flex";
}

function closeEditModal() {
  editModal.style.display = "none";
  editingProductId = null;
  editForm.reset();
}

cancelEditBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", e => {
  if (e.target === editModal) {
    closeEditModal();
  }
});

editForm.addEventListener("submit", e => {
  e.preventDefault();

  const products = loadProducts();
  const product = products.find(p => p.id === editingProductId);

  if (!product) {
    showToast("Product not found", "error");
    return;
  }

  // Update product data
  product.name = editForm.name.value;
  product.department = editForm.department.value;
  product.category = editForm.category.value;
  product.price = Number(editForm.price.value);
  product.stock = Number(editForm.stock.value || 0);
  product.weight = editForm.weight.value;
  product.ingredients = editForm.ingredients.value;

  saveProducts(products);
  showToast("Product updated successfully", "success");
  closeEditModal();
  renderAdmin();
});

// Add new product
form.addEventListener("submit", e => {
  e.preventDefault();

  const products = loadProducts();
  const newProduct = {
    id: Date.now(),
    name: form.name.value,
    department: form.department.value,
    category: form.category.value,
    price: Number(form.price.value),
    stock: Number(form.stock.value || 0),
    weight: form.weight.value,
    ingredients: form.ingredients.value
  };

  products.push(newProduct);
  saveProducts(products);
  showToast("Product added successfully", "success");
  renderAdmin();
  form.reset();
});

// Delete product
function removeProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) {
    return;
  }

  let products = loadProducts();
  products = products.filter(p => p.id !== id);
  saveProducts(products);

  // Also remove from cart if it exists
  if (typeof state !== 'undefined') {
    state.removeFromCart(id);
  }

  showToast("Product deleted successfully", "success");
  renderAdmin();
}

renderAdmin();
