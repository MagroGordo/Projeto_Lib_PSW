"use strict";

window.onload = () => {
  const manager = new ManageBooks();
  manager.init();
};

class ManageBooks {
  constructor() {
    this.booksList = document.getElementById("books-list");
    this.totalBooks = document.getElementById("total-books");

    // Modal and form
    this.modal = document.getElementById("book-modal");
    this.form = document.getElementById("book-form");
    this.modalTitle = document.getElementById("modal-title");

    this.deleteModal = document.getElementById("delete-modal");
    this.deleteBookName = document.getElementById("delete-book-name");

    // Buttons
    this.addBookBtn = document.getElementById("add-book-btn");
    this.closeModalBtn = document.getElementById("close-modal");
    this.cancelBtn = document.getElementById("cancel-btn");
    this.closeDeleteModalBtn = document.getElementById("close-delete-modal");
    this.cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    this.confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    // State
    this.currentEditId = null;
  }

  init = () => {
    this.loadBooks();
    this.loadGenres();

    this.addBookBtn.onclick = this.openNewBookModal;
    this.closeModalBtn.onclick = this.closeModal;
    this.cancelBtn.onclick = this.closeModal;
    this.closeDeleteModalBtn.onclick = this.closeDeleteModal;
    this.cancelDeleteBtn.onclick = this.closeDeleteModal;

    this.form.onsubmit = this.saveBook;
  };

  // =============================
  // LOAD BOOKS
  // =============================
  loadBooks = () => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/books", true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.message !== "ok") return;
        this.renderBooks(result.data);
      }
    };
    xhr.send();
  };

  renderBooks = (books) => {
    this.booksList.innerHTML = "";
    this.totalBooks.textContent = books.length;

    books.forEach((book) => {
      const div = document.createElement("div");
      div.classList.add("book-item");
      div.innerHTML = `
        <div class="book-info">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Genre:</strong> ${book.genre_name || "No genre"}</p>
          <p><strong>ISBN:</strong> ${book.isbn}</p>
          <p><strong>Year:</strong> ${book.publication_year}</p>
          <p><strong>Pages:</strong> ${book.page_count || "N/A"}</p>
          <p><strong>Editor:</strong> ${book.editor || "N/A"}</p>
        </div>
        <div class="book-actions">
          <button class="btn btn-secondary btn-small edit-btn" data-id="${book.id}">Edit</button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${book.id}" data-title="${book.title}">Delete</button>
        </div>
      `;
      this.booksList.appendChild(div);
    });

    document.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        this.openEditModal(e.target.dataset.id)
      )
    );

    document.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", (e) =>
        this.openDeleteModal(e.target.dataset.id, e.target.dataset.title)
      )
    );
  };

  // =============================
  // LOAD GENRES
  // =============================
  loadGenres = () => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/genres", true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        const select = document.getElementById("book-genre");
        select.innerHTML = `<option value="">Select a genre</option>`;
        if (result.message === "ok") {
          result.data.forEach((g) => {
            const opt = document.createElement("option");
            opt.value = g.name;
            opt.textContent = g.name;
            select.appendChild(opt);
          });
        }
      }
    };
    xhr.send();
  };

  // =============================
  // NEW / EDIT MODAL
  // =============================
  openNewBookModal = () => {
    this.modal.style.display = "flex";
    this.modalTitle.textContent = "New Book";
    this.form.reset();
    this.currentEditId = null;
  };

  openEditModal = (id) => {
    this.currentEditId = id;
    this.modal.style.display = "flex";
    this.modalTitle.textContent = "Edit Book";

    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/books/" + id, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.message === "ok" && result.data.length > 0) {
          const b = result.data[0];
          document.getElementById("book-title").value = b.title;
          document.getElementById("book-author").value = b.author;
          document.getElementById("book-isbn").value = b.isbn;
          document.getElementById("book-year").value = b.publication_year;
          document.getElementById("book-genre").value = b.genre_name;
          document.getElementById("book-description").value =
            b.description || "";
          document.getElementById("book-pagecount").value =
            b.page_count || "";
          document.getElementById("book-editor").value = b.editor || "";
        }
      }
    };
    xhr.send();
  };

  // =============================
  // SAVE BOOK (ADD/UPDATE)
  // =============================
  saveBook = (e) => {
    e.preventDefault();

    const data = {
      title: document.getElementById("book-title").value.trim(),
      author: document.getElementById("book-author").value.trim(),
      isbn: document.getElementById("book-isbn").value.trim(),
      year: document.getElementById("book-year").value.trim(),
      genre: document.getElementById("book-genre").value.trim(),
      description: document.getElementById("book-description").value.trim(),
      page_count: document.getElementById("book-pagecount").value.trim(),
      editor: document.getElementById("book-editor").value.trim(),
    };

    for (const [key, value] of Object.entries(data)) {
      if (!value) {
        alert("All fields are required.");
        return;
      }
    }

    const url = this.currentEditId
      ? `/books/update/${this.currentEditId}`
      : "/books/add";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.message === "ok") {
          alert(this.currentEditId ? "Book updated!" : "Book added!");
          this.closeModal();
          this.loadBooks();
        } else if (result.message === "missing_fields") {
          alert("All required fields must be filled!");
        } else {
          alert("Error saving book.");
        }
      }
    };

    xhr.send(JSON.stringify(data));
  };

  closeModal = () => {
    this.modal.style.display = "none";
  };

  // =============================
  // DELETE BOOK
  // =============================
  openDeleteModal = (id, title) => {
    this.deleteModal.style.display = "flex";
    this.deleteBookName.textContent = title;
    this.confirmDeleteBtn.onclick = () => this.deleteBook(id);
  };

  closeDeleteModal = () => {
    this.deleteModal.style.display = "none";
  };

  deleteBook = (id) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/books/delete/" + id, true);
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const result = JSON.parse(xhr.responseText);
        if (result.message === "ok") {
          alert("Book deleted!");
          this.closeDeleteModal();
          this.loadBooks();
        } else {
          alert("Error deleting book.");
        }
      }
    };
    xhr.send();
  };
}