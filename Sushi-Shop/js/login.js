const loginForm = document.getElementById("login-form");

// If already logged in, go to catalog
const existingUser = JSON.parse(localStorage.getItem("currentUser"));
if (existingUser) {
  window.location.href = "index.html";
}

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  const email = loginForm.email.value;
  const password = loginForm.password.value;

  const users = JSON.parse(localStorage.getItem("users")) || [];

  const user = users.find(
    u => u.email === email && u.password === password
  );

  if (!user) {
    showToast("Invalid email or password", "error");
    return;
  }

  localStorage.setItem("currentUser", JSON.stringify(user));

  showToast("Login successful", "success");
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1500);
});
