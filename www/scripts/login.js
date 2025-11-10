"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".auth-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    if (!email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Invalid email format!");
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status === 200 && data.message === "ok") {
            alert("Welcome back!");
            window.location.replace("./dashboard.html");
          } else if (data.message === "invalid") {
            alert("Invalid credentials. Please try again.");
          } else if (data.message === "missing_fields") {
            alert("Missing required fields.");
          } else {
            alert("Error logging in. Please check your connection and try again.");
          }
        } catch (e) {
          console.error("Error parsing response:", e);
          alert("Unexpected server error.");
        }
      }
    };

    const body = JSON.stringify({ email: email, password: password });
    xhr.send(body);
  });
});