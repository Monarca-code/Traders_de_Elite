"use strict";

/* =====================================================
   GALERIA — LIGHTBOX
   Abre as fotos na própria página, sem nova aba.
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const gallery = document.querySelector(".meetings-gallery");
    const lightbox = document.getElementById("galleryLightbox");
    const image = document.getElementById("galleryLightboxImage");
    const caption = document.getElementById("galleryLightboxCaption");
    const closeButton = document.getElementById("galleryLightboxClose");
    const prevButton = document.getElementById("galleryLightboxPrev");
    const nextButton = document.getElementById("galleryLightboxNext");

    if (!gallery || !lightbox || !image || !closeButton) return;

    const items = Array.from(gallery.querySelectorAll("a"));
    let currentIndex = 0;

    function showImage(index) {
        if (!items.length) return;

        currentIndex = (index + items.length) % items.length;

        const link = items[currentIndex];
        const thumb = link.querySelector("img");
        const source = link.getAttribute("href") || thumb?.src || "";

        image.src = source;
        image.alt = thumb?.alt || "Foto da comunidade TRADERS DE ELITE";

        if (caption) {
            caption.textContent = `${currentIndex + 1} / ${items.length}`;
        }
    }

    function openLightbox(index) {
        showImage(index);
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("gallery-open");
        closeButton.focus();
    }

    function closeLightbox() {
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("gallery-open");
        image.removeAttribute("src");
    }

    items.forEach((item, index) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            openLightbox(index);
        });
    });

    closeButton.addEventListener("click", closeLightbox);

    prevButton?.addEventListener("click", () => {
        showImage(currentIndex - 1);
    });

    nextButton?.addEventListener("click", () => {
        showImage(currentIndex + 1);
    });

    lightbox.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!lightbox.classList.contains("is-open")) return;

        if (event.key === "Escape") {
            closeLightbox();
        } else if (event.key === "ArrowLeft") {
            showImage(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            showImage(currentIndex + 1);
        }
    });
});
