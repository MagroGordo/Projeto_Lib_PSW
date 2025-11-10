"use strict";

window.onload = () => {
    const bookPage = new BookPage();
    bookPage.loadBook();
    window.bookPage = bookPage;
};

class BookPage {

    constructor() {
        this.bookId = new URLSearchParams(window.location.search).get("id");
        this.readBtn = document.getElementById("markAsReadBtn");
        this.favoriteBtn = document.getElementById("favoriteBtn");
        this.rateBtn = document.getElementById("rateBookBtn");
        this.reviewFormVisible = false;
    }

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
                this.loadStatus();
            }
        };
        xhr.send();
    };

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

    updateReadButton = (isRead) => {
        if (isRead) {
            this.readBtn.classList.add("active");
            this.readBtn.innerHTML = `<img src="./images/icons/check.png" alt="Read"> Marked as Read`;
        } else {
            this.readBtn.classList.remove("active");
            this.readBtn.innerHTML = `<img src="./images/icons/check.png" alt="Mark as Read"> Mark as Read`;
        }
    };

    updateFavoriteButton = (isFav) => {
        if (isFav) {
            this.favoriteBtn.classList.add("active");
            this.favoriteBtn.innerHTML = `❤️ Favorited`;
        } else {
            this.favoriteBtn.classList.remove("active");
            this.favoriteBtn.innerHTML = `<img src="./images/icons/heart.png" alt="Favorite"> Favorite`;
        }
    };

    addEventListeners = () => {
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

        this.rateBtn.onclick = () => this.toggleReviewForm();
    };

    toggleReviewForm = () => {
        let wrapper = document.getElementById("reviewFormWrapper");
        const reviewsSection = document.querySelector(".reviews-section");
        const reviewsContainer = document.getElementById("reviewsContainer");

        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.id = "reviewFormWrapper";
            wrapper.style.marginBottom = "20px";
            reviewsSection.insertBefore(wrapper, reviewsContainer);

            wrapper.innerHTML = `
                <div class="review-form" id="reviewForm" style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:16px;">
                    <h3 style="margin-bottom:10px;">Write a Review</h3>
                    <form id="addReviewForm">
                        <label for="ratingInput" style="display:block;font-weight:600;margin:8px 0 6px;">Rating (1–5)</label>
                        <input type="number" id="ratingInput" min="1" max="5" step="0.1" required
                               style="width:100%;padding:10px;border:1px solid #d0d0d0;border-radius:6px;margin-bottom:12px;">

                        <label for="commentInput" style="display:block;font-weight:600;margin:8px 0 6px;">Your Comment</label>
                        <textarea id="commentInput" rows="4" required placeholder="Write your thoughts about this book..."
                                  style="width:100%;padding:10px;border:1px solid #d0d0d0;border-radius:6px;margin-bottom:12px;"></textarea>

                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button type="button" id="cancelReviewBtn" class="btn btn-secondary">Cancel</button>
                            <button type="submit" class="btn btn-primary">Submit Review</button>
                        </div>
                    </form>
                </div>
            `;

            this.bindReviewFormEvents();
            this.reviewFormVisible = true;
            return;
        }

        this.reviewFormVisible = !this.reviewFormVisible;
        wrapper.style.display = this.reviewFormVisible ? "block" : "none";
    };

    bindReviewFormEvents = () => {
        const form = document.getElementById("addReviewForm");
        const cancelBtn = document.getElementById("cancelReviewBtn");
        const wrapper = document.getElementById("reviewFormWrapper");

        if (!form) return;

        if (cancelBtn) {
            cancelBtn.onclick = () => {
                if (wrapper) wrapper.style.display = "none";
                this.reviewFormVisible = false;
            };
        }

        form.onsubmit = (e) => {
            e.preventDefault();

            const rating = parseFloat(document.getElementById("ratingInput").value);
            const comment = document.getElementById("commentInput").value.trim();

            if (isNaN(rating) || rating < 1 || rating > 5) {
                alert("Please enter a valid rating between 1 and 5.");
                return;
            }

            if (comment.length === 0) {
                alert("Please enter a comment.");
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.open("POST", `/ratings/${this.bookId}/add`, true);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        const result = JSON.parse(xhr.responseText);
                        if (result.message === "ok") {
                            if (wrapper) wrapper.style.display = "none";
                            this.reviewFormVisible = false;

                            const container = document.getElementById("reviewsContainer");
                            const div = document.createElement("div");
                            div.classList.add("review-box");
                            div.innerHTML = `
                                <div class="review-header-line">
                                    <span class="review-username">${result.data.username}</span>
                                    <span class="review-stars">⭐ ${rating.toFixed(1)}</span>
                                    <span class="review-date">${new Date().toLocaleDateString("pt-PT")}</span>
                                </div>
                                <p class="review-text">${comment}</p>
                            `;
                            container.prepend(div);
                        } else if (result.message === "already_reviewed") {
                            alert("You already reviewed this book.");
                        } else if (result.message === "not_logged") {
                            alert("You must be logged in to review.");
                        } else {
                            alert("Error submitting review.");
                        }
                    } else {
                        alert("Error submitting review.");
                    }
                }
            };

            xhr.send(JSON.stringify({ rating, comment }));
        };
    };

    loadReviews = () => {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/ratings/" + this.bookId, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var result = JSON.parse(xhr.responseText);
                if (result.message !== "ok") return;

                const container = document.getElementById("reviewsContainer");
                const ratingStars = document.getElementById("bookRatingStars");
                const ratingText = document.getElementById("bookRatingText");

                container.innerHTML = "";

                if (result.data.length === 0) {
                    ratingStars.textContent = "⭐ 0.0";
                    ratingText.textContent = "(no reviews yet)";
                    return;
                }

                const total = result.data.reduce((sum, r) => sum + r.rating, 0);
                const avg = (total / result.data.length).toFixed(1);

                ratingStars.textContent = `⭐ ${avg}`;
                ratingText.textContent = `(${result.data.length} review${result.data.length > 1 ? "s" : ""})`;

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

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".back-link").onclick = (event) => {
        event.preventDefault();
        history.back();
    };
});