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

function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

function setCurrentUser(user) {
  localStorage.setItem("currentUser", JSON.stringify(user));
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser"));
}

/* REGISTER */
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", e => {
    e.preventDefault();

    const users = getUsers();
    const { username, email, password } = registerForm;

    if (users.find(u => u.email === email.value)) {
      showToast("User already exists", "error");
      return;
    }

    const newUser = {
      id: Date.now(),
      username: username.value,
      email: email.value,
      password: password.value, // demo only
      role: "user" // default role
    };

    users.push(newUser);
    saveUsers(users);
    showToast("Registration successful", "success");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  });
}

/* LOGIN */
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", e => {
    e.preventDefault();

    const { email, password } = loginForm;
    const users = getUsers();

    const user = users.find(
      u => u.email === email.value && u.password === password.value
    );

    if (!user) {
      showToast("Invalid credentials", "error");
      return;
    }

    // Ensure role is set
    if (!user.role) {
      user.role = "user";
    }

    setCurrentUser(user);
    showToast("Login successful", "success");
    
    // Redirect based on role
    const redirectUrl = user.role === "admin" ? "admin.html" : "index.html";
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1500);
  });
}

/* LOGOUT helper */
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}
