"use strict";

window.onload = () => {
    const statsPage = new StatisticsPage();
    statsPage.loadUserActivity();
    statsPage.loadTopReaders();

    document.getElementById("dashboard-btn").onclick = () => {
        window.location.href = "dashboard.html";
    };
};

class StatisticsPage {
    /**
     * Carrega os 10 utilizadores com login mais recente
     */
    loadUserActivity = () => {
        const tbody = document.querySelector("#user-activity tbody");
        tbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/users/top-recent-logins", true);
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                tbody.innerHTML = "";
                if (this.status === 200) {
                    const result = JSON.parse(this.responseText);
                    if (result.message === "ok") {
                        result.data.forEach((user, index) => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td>${index + 1}</td>
                                <td>${user.username}</td>
                                <td>${new Date(user.last_login).toLocaleString("pt-PT")}</td>
                            `;
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = `<tr><td colspan="3">Unable to load data.</td></tr>`;
                    }
                } else {
                    tbody.innerHTML = `<tr><td colspan="3">Error loading table.</td></tr>`;
                }
            }
        };
        xhr.send();
    };

    /**
     * Carrega os 10 utilizadores com mais livros lidos
     */
    loadTopReaders = () => {
        const tbody = document.querySelector("#read-books tbody");
        tbody.innerHTML = `<tr><td colspan="3">Loading...</td></tr>`;

        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/users/top-readers", true);
        xhr.onreadystatechange = function () {
            if (this.readyState === 4) {
                tbody.innerHTML = "";
                if (this.status === 200) {
                    const result = JSON.parse(this.responseText);
                    if (result.message === "ok") {
                        result.data.forEach((user, index) => {
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td>${index + 1}</td>
                                <td>${user.username}</td>
                                <td>${user.read_count}</td>
                            `;
                            tbody.appendChild(tr);
                        });
                    } else {
                        tbody.innerHTML = `<tr><td colspan="3">Unable to load data.</td></tr>`;
                    }
                } else {
                    tbody.innerHTML = `<tr><td colspan="3">Error loading table.</td></tr>`;
                }
            }
        };
        xhr.send();
    };
}