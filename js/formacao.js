document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       ANO DO FOOTER
    ========================== */

    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }


    /* =========================
       ANIMAÇÃO DOS CARDS
    ========================== */

    const cards = document.querySelectorAll(
        ".formation-card, .method-step"
    );

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(
            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add("visible");

                        observer.unobserve(entry.target);

                    }

                });

            },
            {
                threshold: 0.12
            }
        );

        cards.forEach(card => {

            card.classList.add("reveal");

            observer.observe(card);

        });

    }

});