document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".auth-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.querySelector("#username").value.trim();
    const email = document.querySelector("#email").value.trim();
    const password = document.querySelector("#password").value.trim();
    const confirm = document.querySelector("#confirm-password").value.trim();

    if (!username || !email || !password || !confirm) {
      alert("Preenche todos os campos!");
      return;
    }

    if (password !== confirm) {
      alert("As passwords não coincidem!");
      return;
    }

    try {
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (data.message === "ok") {
        alert("Conta criada com sucesso!");
        window.location.href = "login.html";
      } else if (data.message === "user_exists") {
        alert("Esse utilizador ou email já existe!");
      } else {
        alert("Erro ao criar conta. Verifica os dados e tenta novamente.");
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro inesperado. Tenta novamente mais tarde.");
    }
  });
});