"use strict";

window.onload = (event) => {
  var info = new Library("divInformation");
  info.getBooks();
  window.info = info;
};

/**
 * Classe principal para gerir os livros
 */
class Library {
  constructor(id) {
    this.id = id;
    this.books = [];
  }

  /**
   * Mostra os livros organizados por género, 4 por linha
   */
  showBooksByGenre = () => {
    document.getElementById("headerTitle").textContent = "Livros por Género";

    const container = document.createElement("div");
    container.id = "genresContainer";

    // agrupar livros por género
    const grouped = {};
    this.books.forEach(book => {
      if (!grouped[book.genre]) grouped[book.genre] = [];
      grouped[book.genre].push(book);
    });

    // criar secção para cada género
    for (const genre in grouped) {
      const genreSection = document.createElement("div");
      genreSection.classList.add("genre-section");

      const title = document.createElement("h2");
      title.textContent = genre;
      genreSection.appendChild(title);

      // grid de livros
      const grid = document.createElement("div");
      grid.classList.add("books-grid");

      grouped[genre].forEach(book => {
        const card = document.createElement("div");
        card.classList.add("book-card");

        const img = document.createElement("img");
        img.src = book.image || "no-cover.png"; // imagem padrão se faltar
        img.alt = book.title;

        const titleEl = document.createElement("h3");
        titleEl.textContent = book.title;

        const authorEl = document.createElement("p");
        authorEl.textContent = book.author;

        card.appendChild(img);
        card.appendChild(titleEl);
        card.appendChild(authorEl);

        grid.appendChild(card);
      });

      genreSection.appendChild(grid);
      container.appendChild(genreSection);
    }

    replaceChilds(this.id, container);
  };

  /**
   * Faz pedido AJAX para buscar todos os livros
   */
  getBooks = () => {
    var books = this.books;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/books", true);
    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        var response = JSON.parse(xhr.responseText);
        if (response.message === "ok") {
          books.length = 0;
          response.data.forEach(function (current) {
            books.push(current);
          });
          window.info.showBooksByGenre();
        } else {
          console.error("Erro na resposta:", response);
        }
      }
    };
    xhr.send();
  };
}

/**
 * Substitui os filhos de um elemento HTML
 */
const replaceChilds = (id, newSon) => {
  var no = document.getElementById(id);
  while (no.hasChildNodes()) {
    no.removeChild(no.lastChild);
  }
  if (newSon !== undefined) no.appendChild(newSon);
};