"use strict";

window.onload = () => {
  const info = new Library("divInformation");
  info.getBooks();
  window.info = info;
};

let btnDashboard = document.getElementById("dashboard-btn");

btnDashboard.onclick = () => {
  window.location.href = "./dashboard.html";
};

class Library {
  constructor(id) {
    this.id = id;
    this.books = [];
  }

  showBooksByGenre = () => {
    const container = document.createElement("div");
    container.id = "genresContainer";

    const grouped = {};
    this.books.forEach((book) => {
      const genreName = book.genre || book.genre_name || "Sem género definido";
      if (!grouped[genreName]) grouped[genreName] = [];
      grouped[genreName].push(book);
    });

    // Criar secção com título (h2) para cada género
    Object.keys(grouped)
      .sort()
      .forEach((genreName) => {
        const genreSection = document.createElement("div");
        genreSection.classList.add("genre-section");

        const title = document.createElement("h2");
        title.textContent = genreName; // 👉 aqui cria o h2 com o nome do género
        genreSection.appendChild(title);

        const grid = document.createElement("div");
        grid.classList.add("books-grid");

        grouped[genreName].forEach((book) => {
          const card = document.createElement("div");
          card.classList.add("book-card");
          card.onclick = () => {
            window.location.href = `./book.html?id=${book.id}`;
          };
          card.style.cursor = "pointer";

          const img = document.createElement("img");
          img.src = book.image || "no-cover.png";
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
      });

    replaceChilds(this.id, container);
  };

  getBooks = () => {
    const books = this.books;
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/books", true);
    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        const response = JSON.parse(this.responseText);
        if (response.message === "ok") {
          books.length = 0;
          response.data.forEach((current) => books.push(current));
          window.info.showBooksByGenre();
        } else {
          console.error("Erro na resposta:", response);
        }
      }
    };
    xhr.send();
  };
}

const replaceChilds = (id, newSon) => {
  const no = document.getElementById(id);
  while (no.hasChildNodes()) no.removeChild(no.lastChild);
  if (newSon !== undefined) no.appendChild(newSon);
};