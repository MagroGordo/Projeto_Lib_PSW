"use strict";

window.onload = () => {
    const bookPage = new BookPage();
    bookPage.loadBook();
    window.bookPage = bookPage;
};

/**
 * Classe responsável por gerir a página do livro
 */
class BookPage {

    constructor() {
        this.bookId = new URLSearchParams(window.location.search).get("id");
    }

    /**
     * Carrega os dados do livro da API
     */
    loadBook = () => {

        if (!this.bookId) {
            alert("Livro não encontrado.");
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/books/" + this.bookId, true);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {

                var result = JSON.parse(xhr.responseText);

                if (result.message !== "ok" || result.data.length === 0) {
                    alert("Livro não encontrado.");
                    return;
                }

                var book = result.data[0];
                this.showBookDetails(book); // método da classe
                this.loadReviews(); // carrega reviews
            }
        };

        xhr.send();
    };

    /**
     * Mostra os dados do livro na página
     */
    showBookDetails = (book) => {
        document.getElementById("bookCoverImage").src = book.image || "no-cover.png";
        document.getElementById("bookTitle").textContent = book.title;
        document.getElementById("bookAuthor").textContent = book.author;
        document.getElementById("bookGenre").textContent = book.genre;
        document.getElementById("bookDescription").textContent = book.description || "Sem descrição disponível.";

        // estrelas
        if (book.rating !== undefined && book.rating !== null) {
            document.getElementById("bookRatingStars").textContent = "★".repeat(book.rating);
            document.getElementById("bookRatingText").textContent = book.rating + "/5";
        }

        // info extra
        document.getElementById("bookNotes").innerHTML = `
            <p><strong>ISBN:</strong> ${book.isbn || "Não disponível"}</p>
            <p><strong>Ano de Publicação:</strong> ${book.publication_year || "Desconhecido"}</p>
            <p><strong>Número de Páginas:</strong> ${book.page_count || "N/A"}</p>
            <p><strong>Editora:</strong> ${book.editor || "Não indicada"}</p>
        `;
    };

    /**
     * Carrega reviews (username + rating + texto)
     */
    loadReviews() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/ratings/" + this.bookId, true);

        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                var result = JSON.parse(this.responseText);

                if (result.message !== "ok") return;

                var container = document.getElementById("reviewsContainer");
                container.innerHTML = "";

                result.data.forEach(review => {

                    const div = document.createElement("div");
                    div.classList.add("review-box");

                    div.innerHTML = `
                        <div class="review-header-line">
                            <span class="review-username">${review.username}</span>
                            <span class="review-stars">⭐ ${review.rating.toFixed(1)}</span>
                            <span class="review-date">${new Date(review.created_at).toLocaleDateString("pt-PT")}</span>
                        </div>
                        <p class="review-text">${review.comment}</p>
                    `;

                    container.appendChild(div);
                });
            }
        };

        xhr.send();
    }
};

// Botão voltar
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".back-link").onclick = function(event) {
        event.preventDefault();
        history.back();
    };
});
