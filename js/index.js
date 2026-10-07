document.addEventListener("DOMContentLoaded", async () => {

    const navPortal = document.querySelector(
        '.nav-actions a[href="portal/login.html"]'
    );

    const portalSectionButton = document.querySelector(
        '.portal-section a.btn'
    );

    try {

        const user = await account.get();

        console.log("✅ Membro reconhecido pelo Appwrite:", user);

        const nome = user.name || "Membro";

        // Botão do menu
        if (navPortal) {
            navPortal.textContent = `♟ Olá, ${nome}`;
            navPortal.href = "portal/login.html";
        }

        // Botão da seção Portal
        if (portalSectionButton) {
            portalSectionButton.textContent =
                "ENTRAR NO PORTAL →";

            portalSectionButton.href =
                "portal/dashboard.html";
        }

    } catch (error) {

        console.log("ℹ️ Visitante não autenticado.");

        // Botão do menu
        if (navPortal) {
            navPortal.textContent =
                "♟ Portal do Estudante";

            navPortal.href =
                "portal/login.html";
        }

        // Botão da seção Portal
        if (portalSectionButton) {
            portalSectionButton.textContent =
                "ENTRAR NO PORTAL →";

            portalSectionButton.href =
                "portal/login.html";
        }
    }
});