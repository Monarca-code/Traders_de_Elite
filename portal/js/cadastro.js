document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");
    const message = document.getElementById("registerMessage");
    const button = document.getElementById("registerButton");

    const password = document.getElementById("password");
    const passwordConfirm = document.getElementById("passwordConfirm");

    document.getElementById("year").textContent = new Date().getFullYear();

    function showMessage(text, type = "") {
        message.textContent = text;
        message.className = "form-message";
        if (type) message.classList.add(type);
    }

    function toggle(input, buttonEl) {
        const visible = input.type === "text";
        input.type = visible ? "password" : "text";
        buttonEl.setAttribute(
            "aria-label",
            visible ? "Mostrar senha" : "Ocultar senha"
        );
    }

    document.getElementById("togglePassword")
        ?.addEventListener("click", e => toggle(password, e.currentTarget));

    document.getElementById("togglePasswordConfirm")
        ?.addEventListener("click", e => toggle(passwordConfirm, e.currentTarget));

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const nome = document.getElementById("nome").value.trim();
        const email = document.getElementById("email").value.trim();
        const telefone = document.getElementById("telefone").value.trim();

        if (!nome || !email || !password.value) {
            showMessage("Preencha os campos obrigatórios.", "error");
            return;
        }

        if (password.value.length < 8) {
            showMessage("A senha deve ter pelo menos 8 caracteres.", "error");
            return;
        }

        if (password.value !== passwordConfirm.value) {
            showMessage("As senhas não coincidem.", "error");
            return;
        }

        button.disabled = true;
        button.innerHTML = "A CRIAR CONTA...";
        showMessage("A criar a sua conta...");

        try {
            const user = await account.create(
                Appwrite.ID.unique(),
                email,
                password.value,
                nome
            );

            /*
             * O perfil é criado pelo próprio utilizador autenticado.
             * A collection "profiles" deve permitir CREATE para Role.users().
             */
            await account.createEmailPasswordSession(email, password.value);

            try {
                await databases.createDocument(
                    DATABASE_ID,
                    PROFILES_COLLECTION_ID,
                    user.$id,
                    {
                        nome_completo: nome,
                        email,
                        telefone,
                        tipo: "estudante",
                        estado: "ativo",
                        data_registro: new Date().toISOString()
                    }
                );
            } catch (profileError) {
                /*
                 * A conta já existe. Se houver erro de permission,
                 * mostramos no console sem apagar a conta.
                 */
                console.warn("⚠️ Conta criada, mas o perfil não foi criado:", profileError);
            }

            showMessage("Conta criada com sucesso! A entrar no portal...", "success");

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 800);

        } catch (error) {
            console.error("❌ Erro no cadastro:", error);

            button.disabled = false;
            button.innerHTML = 'CRIAR MINHA CONTA <span>→</span>';

            if (error.code === 409) {
                showMessage("Este e-mail já possui uma conta.", "error");
            } else {
                showMessage(
                    "Não foi possível criar a conta: " + (error.message || "erro desconhecido."),
                    "error"
                );
            }
        }
    });
});
