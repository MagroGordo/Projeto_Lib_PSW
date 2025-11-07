"use strict";

let btnStartNow = document.querySelector(".btn-primary");
let btnLogIn = document.querySelector(".btn-secondary");

btnStartNow.addEventListener("click", function() {
    window.location.href = "./signup.html";
});

btnLogIn.addEventListener("click", function() {
    window.location.href = "./login.html";
});