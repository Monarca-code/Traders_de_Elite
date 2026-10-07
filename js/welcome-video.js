/* =========================================================
   TRADERS DE ELITE
   MINI VÍDEO DE BOAS-VINDAS
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const welcomeVideo = document.getElementById("welcomeVideo");
    const closeButton = document.getElementById("welcomeVideoClose");
    const openButton = document.getElementById("welcomeVideoOpen");

    if (!welcomeVideo || !closeButton || !openButton) {
        return;
    }

    closeButton.addEventListener("click", () => {

        welcomeVideo.classList.add("hidden");
        openButton.classList.add("visible");

    });

    openButton.addEventListener("click", () => {

        welcomeVideo.classList.remove("hidden");
        openButton.classList.remove("visible");

    });

});