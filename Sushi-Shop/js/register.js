function register() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (!email || !password || !confirmPassword) {
    showToast("Please fill in all fields", "warning");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match", "error");
    return;
  }

  const users = JSON.parse(localStorage.getItem("users")) || [];

  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    showToast("User already exists", "error");
    return;
  }

  const newUser = {
    id: Date.now(),
    email,
    password
  };

  users.push(newUser);
  localStorage.setItem("users", JSON.stringify(users));

  showToast("Registration successful!", "success");
  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
}
