const header = document.getElementById("header");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

/* =========================
   MENU MOBILE
========================= */

function closeMenu() {
    menuToggle?.classList.remove("active");
    mainNav?.classList.remove("active");
    document.body.classList.remove("menu-open");

    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Abrir menu");
}

menuToggle?.addEventListener("click", () => {

    const active = mainNav.classList.toggle("active");

    menuToggle.classList.toggle("active", active);
    document.body.classList.toggle("menu-open", active);

    menuToggle.setAttribute(
        "aria-expanded",
        String(active)
    );
    menuToggle.setAttribute(
        "aria-label",
        active ? "Fechar menu" : "Abrir menu"
    );
});

/* Fechar ao clicar num link */

document.querySelectorAll(".main-nav a").forEach(link => {

    link.addEventListener("click", () => {
        closeMenu();
    });

});

/* Fechar clicando fora */

document.addEventListener("click", event => {

    if (
        mainNav?.classList.contains("active") &&
        !mainNav.contains(event.target) &&
        !menuToggle.contains(event.target)
    ) {
        closeMenu();
    }

});

/* Fechar com ESC */

document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
        closeMenu();
    }

});

/* =========================
   HEADER AO FAZER SCROLL
========================= */

window.addEventListener("scroll", () => {

    if (window.scrollY > 30) {
        header?.classList.add("scrolled");
    } else {
        header?.classList.remove("scrolled");
    }

}, { passive: true });

/* =========================
   ANIMAÇÕES REVEAL
========================= */

const revealObserver = new IntersectionObserver(
    entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("visible");

                revealObserver.unobserve(
                    entry.target
                );
            }

        });

    },
    {
        threshold: 0.12
    }
);

document.querySelectorAll(".reveal").forEach(element => {

    revealObserver.observe(element);

});

/* =========================
   ANO DO FOOTER
========================= */

const year = document.getElementById("year");

if (year) {
    year.textContent = new Date().getFullYear();
}
/*==========================
    CONTADORES ANIMADOS
==========================*/

const counters = document.querySelectorAll(".counter");

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const counter = entry.target;
        const target = +counter.dataset.target;

        let current = 0;
        const increment = target / 100;

        const updateCounter = () => {

            current += increment;

            if (current < target) {

                counter.innerText = Math.ceil(current);

                requestAnimationFrame(updateCounter);

            } else {

                counter.innerText = target + "+";

            }

        };

        updateCounter();

        observer.unobserve(counter);

    });

}, {
    threshold: 0.5
});

counters.forEach(counter => observer.observe(counter));