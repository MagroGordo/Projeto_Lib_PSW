"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".auth-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();
    const confirm = document.querySelector("#confirm-password").value.trim();

    // Verificações básicas
    if (!username || !email || !password || !confirm) {
      alert("Preenche todos os campos!");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Formato de email inválido!");
      return;
    }

    // Confirmar password
    if (password !== confirm) {
      alert("As passwords não coincidem!");
      return;
    }

    // Criar requisição AJAX
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/signup", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status === 200 && data.message === "ok") {
            alert("Conta criada com sucesso!");
            // Login automático (server já cria sessão)
            window.location.replace("./dashboard.html");
          } else if (data.message === "user_exists") {
            alert("Esse email já está registado!");
          } else if (data.message === "invalid_email") {
            alert("Formato de email inválido!");
          } else if (data.message === "missing_fields") {
            alert("Preenche todos os campos!");
          } else {
            alert("Erro ao criar conta. Tenta novamente.");
          }
        } catch (e) {
          console.error("Erro ao interpretar resposta:", e);
          alert("Erro inesperado no servidor.");
        }
      }
    };

    xhr.onerror = function () {
      alert("Erro de rede. Verifica a ligação e tenta novamente.");
    };

    const body = JSON.stringify({
      username: username,
      email: email,
      password: password,
    });
    xhr.send(body);
  });
});