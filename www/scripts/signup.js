"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".auth-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();
    const confirm = document.querySelector("#confirm-password").value.trim();

    if (!username || !email || !password || !confirm) {
      alert("Please fill in all fields!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format!");
      return;
    }

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/signup", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status === 200 && data.message === "ok") {
            alert("Account created successfully");
            window.location.replace("./dashboard.html");
          } else if (data.message === "user_exists") {
            alert("This email is already registered!");
          } else if (data.message === "invalid_email") {
            alert("Invalid email format!");
          } else if (data.message === "missing_fields") {
            alert("Please fill in all fields!");
          } else {
            alert("Error creating account. Please try again.");
          }
        } catch (e) {
          console.error("Error parsing response:", e);
          alert("Unexpected server error.");
        }
      }
    };

    xhr.onerror = function () {
      alert("Network error. Please check your connection and try again.");
    };

    const body = JSON.stringify({
      username: username,
      email: email,
      password: password,
    });
    xhr.send(body);
  });
});