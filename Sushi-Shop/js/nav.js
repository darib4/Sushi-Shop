// nav.js - tiny helper for showing nav links and logout across pages

(function () {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const adminLink = document.getElementById("nav-admin");
  const loginLink = document.getElementById("nav-login");
  const logoutBtn = document.getElementById("nav-logout") || document.getElementById("logoutBtn");
  const cartIcon = document.getElementById("cartIcon");
  const catalogLink = Array.from(document.querySelectorAll("a")).find(a => a.href.includes("index.html") && a.textContent.includes("Catalog"));

  // Hide cart for admin users
  if (cartIcon && user && user.role === "admin") {
    cartIcon.style.display = "none";
  }

  // Hide catalog link for admin users
  if (catalogLink && user && user.role === "admin") {
    catalogLink.style.display = "none";
  }

  if (adminLink) {
    adminLink.style.display = user && user.role === "admin" ? "inline" : "none";
  }

  if (loginLink) {
    loginLink.style.display = user ? "none" : "inline";
  }

  if (logoutBtn) {
    logoutBtn.style.display = user ? "inline" : "none";
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("currentUser");
      window.location.href = "login.html";
    });
  }

  // Redirect admin users away from catalog and cart pages
  const currentPage = window.location.pathname;
  if (user && user.role === "admin") {
    if (currentPage.includes("index.html") || currentPage.endsWith("index.html") || currentPage === "/" || currentPage.endsWith("/")) {
      window.location.href = "admin.html";
    }
    if (currentPage.includes("cart.html")) {
      window.location.href = "admin.html";
    }
  }
})();
