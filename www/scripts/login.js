document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".auth-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();

    if (!email || !password) {
      alert("Preenche todos os campos!");
      return;
    }

    try {
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.message === "ok") {
        alert("Bem-vindo de volta, " + data.email + "!");
        window.location.href = "./search_books.html";
      } else if (data.message === "invalid") {
        alert("Credenciais inválidas. Tenta novamente.");
      } else {
        alert("Erro no login. Verifica a ligação ao servidor.");
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro inesperado. Tenta novamente mais tarde.");
    }
  });
});