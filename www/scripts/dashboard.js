"use strict";

window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

window.onload = () => {
  loadDashboard();

  // Botão de pesquisa → redireciona para search_books.html
  document.getElementById("search-btn").onclick = () => {
    window.location.href = "./search_books.html";
  };

  document.getElementById("stats-btn").onclick = () => {
    window.location.href = "./statistics.html";
  };

  // Botão de logout → termina sessão e volta ao login
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "/logout", true);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
          const result = JSON.parse(this.responseText);
          if (result.message === "ok") {
            alert("Sessão terminada com sucesso!");
            window.location.href = "./login.html";
          } else {
            alert("Erro ao terminar sessão.");
          }
        }
      };

      xhr.send();
    });
  }
};

/**
 * Carrega livros favoritos e lidos do utilizador
 */
function loadDashboard() {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", "/dashboard", true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const result = JSON.parse(this.responseText);
      if (result.message !== "ok") {
        alert("Erro ao carregar dashboard.");
        return;
      }

      showBooks(result.favorites, "favorites-books");
      showBooks(result.read, "read-books");
    }
  };

  xhr.send();
}

/**
 * Mostra livros dentro de um container
 */
function showBooks(books, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  if (!books || books.length === 0) {
    container.innerHTML = `<p class="no-books">No books here yet.</p>`;
    return;
  }

  books.forEach(book => {
    const card = document.createElement("div");
    card.classList.add("favorite-book-card");
    card.onclick = () => {
      window.location.href = `./book.html?id=${book.id}`;
    };

    const img = document.createElement("img");
    img.src = book.image || "no-cover.png";
    img.alt = book.title;

    const infoDiv = document.createElement("div");
    infoDiv.classList.add("book-info");

    const titleEl = document.createElement("h3");
    titleEl.textContent = book.title;

    const authorEl = document.createElement("p");
    authorEl.textContent = book.author;

    infoDiv.appendChild(titleEl);
    infoDiv.appendChild(authorEl);
    card.appendChild(img);
    card.appendChild(infoDiv);

    container.appendChild(card);
  });
}