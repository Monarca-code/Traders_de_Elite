document.addEventListener(
    "DOMContentLoaded",
    () => {

        // =================================================
        // ELEMENTOS
        // =================================================

        const form =
            document.getElementById(
                "resetPasswordForm"
            );

        const password =
            document.getElementById(
                "password"
            );

        const passwordConfirm =
            document.getElementById(
                "passwordConfirm"
            );

        const resetButton =
            document.getElementById(
                "resetButton"
            );

        const message =
            document.getElementById(
                "resetMessage"
            );

        const togglePassword =
            document.getElementById(
                "togglePassword"
            );

        const togglePasswordConfirm =
            document.getElementById(
                "togglePasswordConfirm"
            );

        const year =
            document.getElementById(
                "year"
            );


        // =================================================
        // ANO
        // =================================================

        if (year) {

            year.textContent =
                new Date().getFullYear();

        }


        // =================================================
        // MENSAGEM
        // =================================================

        function showMessage(
            text,
            type = ""
        ) {

            if (!message) return;

            message.textContent = text;

            message.className =
                "form-message";

            if (type) {

                message.classList.add(
                    type
                );

            }

        }


        // =================================================
        // MOSTRAR / OCULTAR SENHA
        // =================================================

        function toggleInput(
            input,
            button
        ) {

            if (!input || !button) {
                return;
            }

            const visible =
                input.type === "text";

            input.type =
                visible
                    ? "password"
                    : "text";

            button.setAttribute(
                "aria-label",
                visible
                    ? "Mostrar senha"
                    : "Ocultar senha"
            );

        }


        togglePassword?.addEventListener(
            "click",
            () => {

                toggleInput(
                    password,
                    togglePassword
                );

            }
        );


        togglePasswordConfirm?.addEventListener(
            "click",
            () => {

                toggleInput(
                    passwordConfirm,
                    togglePasswordConfirm
                );

            }
        );


        // =================================================
        // LER PARÂMETROS DO APPWRITE
        // =================================================

        const params =
            new URLSearchParams(
                window.location.search
            );


        const userId =
            params.get("userId");

        const secret =
            params.get("secret");


        console.log(
            "🔐 Recuperação recebida."
        );


        // =================================================
        // VERIFICAR LINK
        // =================================================

        if (!userId || !secret) {

            showMessage(
                "Este link de recuperação é inválido ou está incompleto.",
                "error"
            );


            if (resetButton) {

                resetButton.disabled =
                    true;

            }

            return;
        }


        // =================================================
        // REDEFINIR SENHA
        // =================================================

        form?.addEventListener(
            "submit",
            async event => {

                event.preventDefault();


                const newPassword =
                    password?.value || "";

                const confirmPassword =
                    passwordConfirm?.value || "";


                // -----------------------------------------
                // VALIDAÇÃO
                // -----------------------------------------

                if (
                    !newPassword ||
                    !confirmPassword
                ) {

                    showMessage(
                        "Preencha os dois campos de senha.",
                        "error"
                    );

                    return;

                }


                if (
                    newPassword.length < 8
                ) {

                    showMessage(
                        "A senha deve ter pelo menos 8 caracteres.",
                        "error"
                    );

                    return;

                }


                if (
                    newPassword !==
                    confirmPassword
                ) {

                    showMessage(
                        "As senhas não coincidem.",
                        "error"
                    );

                    return;

                }


                // -----------------------------------------
                // BLOQUEAR BOTÃO
                // -----------------------------------------

                if (resetButton) {

                    resetButton.disabled =
                        true;

                    resetButton.innerHTML =
                        "A REDEFINIR...";

                }


                showMessage(
                    "A atualizar a sua senha..."
                );


                // -----------------------------------------
                // APPWRITE
                // -----------------------------------------

                try {

                    await account.updateRecovery(
    userId,
    secret,
    newPassword,
    confirmPassword
);


                    console.log(
                        "✅ Senha redefinida."
                    );


                    showMessage(
                        "Senha alterada com sucesso! Será redirecionado para o login.",
                        "success"
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "login.html";

                        },
                        1800
                    );


                } catch (error) {

                    console.error(
                        "❌ Erro ao redefinir senha:",
                        error
                    );


                    if (resetButton) {

                        resetButton.disabled =
                            false;

                        resetButton.innerHTML =
                            'REDEFINIR SENHA <span>→</span>';

                    }


                    // -------------------------------------
                    // LINK EXPIRADO / INVÁLIDO
                    // -------------------------------------

                    if (
                        error.code === 401 ||
                        error.code === 404
                    ) {

                        showMessage(
                            "Este link expirou ou já foi utilizado. Solicite uma nova recuperação de senha.",
                            "error"
                        );

                        return;

                    }


                    if (
                        error.code === 400
                    ) {

                        showMessage(
                            "Não foi possível redefinir a senha. Verifique os dados e tente novamente.",
                            "error"
                        );

                        return;

                    }


                    showMessage(
                        "Erro ao redefinir a senha: " +
                        (
                            error.message ||
                            "erro desconhecido."
                        ),
                        "error"
                    );

                }

            }
        );

    }
);