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
        this.readBtn = document.getElementById("markAsReadBtn");
        this.favoriteBtn = document.getElementById("favoriteBtn");
    }

    /**
     * Carrega dados do livro
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
                this.showBookDetails(book);
                this.loadReviews();
                this.loadStatus(); // 🧠 carregar estado real dos botões
            }
        };
        xhr.send();
    };

    /**
     * Mostra detalhes
     */
    showBookDetails = (book) => {
        document.getElementById("bookCoverImage").src = book.image || "no-cover.png";
        document.getElementById("bookTitle").textContent = book.title;
        document.getElementById("bookAuthor").textContent = book.author;
        document.getElementById("bookGenre").textContent = book.genre_name || book.genre || "Sem género definido";
        document.getElementById("bookDescription").textContent = book.description || "Sem descrição disponível.";
        document.getElementById("bookNotes").innerHTML = `
            <p><strong>ISBN:</strong> ${book.isbn || "Não disponível"}</p>
            <p><strong>Ano de Publicação:</strong> ${book.publication_year || "Desconhecido"}</p>
            <p><strong>Número de Páginas:</strong> ${book.page_count || "N/A"}</p>
            <p><strong>Editora:</strong> ${book.editor || "Não indicada"}</p>
        `;
    };

    /**
     * Pede o estado atual do livro para o user logado
     */
    loadStatus = () => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", `/books/${this.bookId}/status`, true);

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var result = JSON.parse(xhr.responseText);
                if (result.message !== "ok") return;

                const { is_read, is_favorite } = result.data;
                this.updateReadButton(is_read);
                this.updateFavoriteButton(is_favorite);
                this.addEventListeners();
            }
        };
        xhr.send();
    };

    /**
     * Atualiza aspeto visual do botão "Mark as Read"
     */
    updateReadButton = (isRead) => {
        if (isRead) {
            this.readBtn.classList.add("active");
            this.readBtn.innerHTML = `<img src="./images/icons/check.png" alt="Read"> Marked as Read`;
        } else {
            this.readBtn.classList.remove("active");
            this.readBtn.innerHTML = `<img src="./images/icons/check.png" alt="Mark as Read"> Mark as Read`;
        }
    };

    /**
     * Atualiza aspeto visual do botão "Favorite"
     */
    updateFavoriteButton = (isFav) => {
        if (isFav) {
            this.favoriteBtn.classList.add("active");
            this.favoriteBtn.innerHTML = `❤️ Favorited`;
        } else {
            this.favoriteBtn.classList.remove("active");
            this.favoriteBtn.innerHTML = `<img src="./images/icons/heart.png" alt="Favorite"> Favorite`;
        }
    };

    /**
     * Adiciona eventos aos botões (uma única vez)
     */
    addEventListeners = () => {
        // Evitar duplicar listeners
        this.readBtn.onclick = () => {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", `/books/${this.bookId}/toggle-read`, true);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    const result = JSON.parse(xhr.responseText);
                    if (result.message === "ok")
                        this.updateReadButton(result.is_read);
                }
            };
            xhr.send();
        };

        this.favoriteBtn.onclick = () => {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", `/books/${this.bookId}/toggle-favorite`, true);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    const result = JSON.parse(xhr.responseText);
                    if (result.message === "ok")
                        this.updateFavoriteButton(result.is_favorite);
                }
            };
            xhr.send();
        };
    };

    /**
     * Carrega as reviews
     */
    loadReviews = () => {
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
    };
}

// Botão voltar
document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".back-link").onclick = (event) => {
        event.preventDefault();
        history.back();
    };
});