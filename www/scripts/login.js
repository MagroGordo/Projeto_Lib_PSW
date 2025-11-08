"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".auth-form");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    // Verificação básica
    if (!email || !password) {
      alert("Preenche todos os campos!");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Formato de email inválido!");
      return;
    }

    // Criar requisição AJAX
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        try {
          const data = JSON.parse(xhr.responseText);

          if (xhr.status === 200 && data.message === "ok") {
            alert("Bem-vindo de volta!");
            window.location.replace("./dashboard.html");
          } else if (data.message === "invalid") {
            alert("Credenciais inválidas. Tenta novamente.");
          } else if (data.message === "missing_fields") {
            alert("Faltam campos obrigatórios.");
          } else {
            alert("Erro no login. Verifica a ligação ou tenta novamente.");
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

    const body = JSON.stringify({ email: email, password: password });
    xhr.send(body);
  });
});