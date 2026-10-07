document.addEventListener("DOMContentLoaded", async () => {

    // =====================================================
    // CONFIGURAÇÃO
    // =====================================================

    const ADMIN_EMAIL = "tradersdeelite2026@gmail.com";

    const loginForm = document.getElementById("loginForm");
    const loginMessage = document.getElementById("loginMessage");
    const loginButton = document.getElementById("loginButton");
    const togglePassword = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    const forgotPassword = document.getElementById("forgotPassword");
    const year = document.getElementById("year");


    // =====================================================
    // ANO
    // =====================================================

    if (year) {
        year.textContent = new Date().getFullYear();
    }


    // =====================================================
    // MENSAGEM
    // =====================================================

    function showMessage(message, type = "") {

        if (!loginMessage) return;

        loginMessage.textContent = message;
        loginMessage.className = "form-message";

        if (type) {
            loginMessage.classList.add(type);
        }
    }


    // =====================================================
    // REDIRECIONAMENTO
    // =====================================================

    function redirectUser(user) {

        if (!user || !user.email) {
            window.location.href = "dashboard.html";
            return;
        }

        const email =
            user.email.trim().toLowerCase();

        console.log(
            "👤 Utilizador autenticado:",
            email
        );


        // ADMINISTRADOR
        if (
            email ===
            ADMIN_EMAIL.toLowerCase()
        ) {

            console.log(
                "🔐 Administrador reconhecido."
            );

            window.location.href =
                "admin/index.html";

            return;
        }


        // ALUNO
        console.log(
            "🎓 Utilizador normal."
        );

        window.location.href =
            "dashboard.html";
    }


    // =====================================================
    // VERIFICAR SESSÃO EXISTENTE
    // =====================================================

    try {

        const user =
            await account.get();

        console.log(
            "✅ Sessão encontrada:",
            user
        );

        showMessage(
            "Sessão já iniciada. A verificar o seu acesso..."
        );

        setTimeout(() => {

            redirectUser(user);

        }, 400);

        return;

    } catch (error) {

        console.log(
            "ℹ️ Nenhuma sessão ativa."
        );
    }


    // =====================================================
    // MOSTRAR / OCULTAR SENHA
    // =====================================================

    togglePassword?.addEventListener(
        "click",
        () => {

            if (!passwordInput) return;

            const visible =
                passwordInput.type === "text";

            passwordInput.type =
                visible
                    ? "password"
                    : "text";

            togglePassword.setAttribute(
                "aria-label",
                visible
                    ? "Mostrar senha"
                    : "Ocultar senha"
            );
        }
    );


    // =====================================================
    // LOGIN
    // =====================================================

    loginForm?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const emailElement =
                document.getElementById("email");

            const email =
                emailElement?.value.trim() || "";

            const password =
                passwordInput?.value || "";


            // ---------------------------------------------
            // VALIDAÇÃO
            // ---------------------------------------------

            if (!email || !password) {

                showMessage(
                    "Preencha o e-mail e a senha.",
                    "error"
                );

                return;
            }


            // ---------------------------------------------
            // BLOQUEAR BOTÃO
            // ---------------------------------------------

            if (loginButton) {

                loginButton.disabled = true;

                loginButton.innerHTML =
                    "A ENTRAR...";
            }

            showMessage(
                "A verificar os seus dados..."
            );


            // ---------------------------------------------
            // LOGIN APPWRITE
            // ---------------------------------------------

            try {

                const session =
                    await account.createEmailPasswordSession(
    email,
    password
);


                console.log(
                    "✅ Sessão criada:",
                    session
                );


                // -----------------------------------------
                // UTILIZADOR
                // -----------------------------------------

                const user =
                    await account.get();


                console.log(
                    "👤 Utilizador:",
                    user
                );


                const loggedEmail =
                    user.email
                        .trim()
                        .toLowerCase();


                // -----------------------------------------
                // ADMINISTRADOR
                // -----------------------------------------

                if (
                    loggedEmail ===
                    ADMIN_EMAIL.toLowerCase()
                ) {

                    console.log(
                        "🔐 ADMINISTRADOR DETETADO"
                    );

                    showMessage(
                        "Administrador autenticado. A entrar na área administrativa...",
                        "success"
                    );

                    setTimeout(() => {

                        window.location.href =
                            "admin/index.html";

                    }, 500);

                    return;
                }


                // -----------------------------------------
                // ALUNO
                // -----------------------------------------

                console.log(
                    "🎓 ALUNO DETETADO"
                );

                showMessage(
                    "Login realizado com sucesso!",
                    "success"
                );

                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 500);


            } catch (error) {

                console.error(
                    "❌ Erro no login:",
                    error
                );


                if (loginButton) {

                    loginButton.disabled = false;

                    loginButton.innerHTML =
                        'ENTRAR NO PORTAL <span>→</span>';
                }


                if (error.code === 401) {

                    showMessage(
                        "E-mail ou senha incorretos.",
                        "error"
                    );

                }

                else if (error.code === 429) {

                    showMessage(
                        "Muitas tentativas. Aguarde alguns minutos.",
                        "error"
                    );

                }

                else {

                    showMessage(
                        "Não foi possível entrar: " +
                        (
                            error.message ||
                            "erro desconhecido."
                        ),
                        "error"
                    );
                }
            }
        }
    );


    // =====================================================
    // RECUPERAÇÃO DE SENHA
    // =====================================================

    forgotPassword?.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            const emailElement =
                document.getElementById("email");

            const email =
                emailElement?.value.trim() || "";


            // ---------------------------------------------
            // VERIFICAR E-MAIL
            // ---------------------------------------------

            if (!email) {

                showMessage(
                    "Digite o seu e-mail primeiro.",
                    "error"
                );

                emailElement?.focus();

                return;
            }


            // ---------------------------------------------
            // VALIDAR FORMATO
            // ---------------------------------------------

            if (
                !emailElement.checkValidity()
            ) {

                showMessage(
                    "Digite um endereço de e-mail válido.",
                    "error"
                );

                emailElement.focus();

                return;
            }


            // ---------------------------------------------
            // URL DE RECUPERAÇÃO
            // ---------------------------------------------

            const recoveryUrl =
                new URL(
                    "redefinir-senha.html",
                    window.location.href
                ).href;


            console.log(
                "📧 URL de recuperação:",
                recoveryUrl
            );


            // ---------------------------------------------
            // DESATIVAR LINK
            // ---------------------------------------------

            forgotPassword.style.pointerEvents =
                "none";

            forgotPassword.style.opacity =
                "0.6";


            showMessage(
                "A enviar o link de recuperação..."
            );


            // ---------------------------------------------
            // APPWRITE
            // ---------------------------------------------

            try {

                await account.createRecovery(
    email,
    recoveryUrl
);


                console.log(
                    "✅ Link de recuperação enviado."
                );


                showMessage(
                    "Enviámos um link de recuperação para o seu e-mail. Verifique também a pasta de spam.",
                    "success"
                );


            } catch (error) {

                console.error(
                    "❌ Erro na recuperação:",
                    error
                );


                if (error.code === 429) {

                    showMessage(
                        "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
                        "error"
                    );

                }

                else if (error.code === 400) {

                    showMessage(
                        "Não foi possível iniciar a recuperação. Verifique o e-mail e a configuração do Appwrite.",
                        "error"
                    );

                }

                else {

                    showMessage(
                        "Erro ao enviar o link: " +
                        (
                            error.message ||
                            "erro desconhecido."
                        ),
                        "error"
                    );
                }
            }


            // ---------------------------------------------
            // REATIVAR LINK
            // ---------------------------------------------

            setTimeout(() => {

                forgotPassword.style.pointerEvents =
                    "";

                forgotPassword.style.opacity =
                    "";

            }, 3000);

        }
    );

});