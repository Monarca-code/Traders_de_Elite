"use strict";

/* =========================================================
   TRADERS DE ELITE
   SUPORTE IA — FRONTEND
   ========================================================= */

const SUPPORT_API_URL =
    "https://www.tradersdeelite.school/api/support";


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const input =
        document.querySelector("#messageInput");

    const sendButton =
        document.querySelector("#sendButton");

    const clearButton =
        document.querySelector("#clearChat");

    const chatMessages =
        document.querySelector("#messages");

    const chatForm =
        document.querySelector("#chatForm");

    const counter =
        document.querySelector("#messageCounter");

    const statusText =
        document.querySelector("#statusText");


    if (!input || !sendButton || !chatMessages) {

        console.error(
            "❌ Elementos do suporte IA não encontrados."
        );

        return;
    }


    console.log(
        "✅ Suporte IA carregado."
    );


    /* =====================================================
       MENSAGEM INICIAL
       ===================================================== */

    function showWelcomeMessage() {

        if (chatMessages.children.length > 0) {
            return;
        }

        addMessage(
            "Olá! Sou o assistente oficial da TRADERS DE ELITE. Posso ajudar com informações sobre a comunidade, missão, formações, Sala Virtual, Market Desk, Portal do Estudante, eventos, parceiros e utilização da plataforma. O que gostaria de saber?",
            "bot"
        );
    }


    /* =====================================================
       ADICIONAR MENSAGEM
       ===================================================== */

    function addMessage(
        text,
        type = "bot"
    ) {

        const message =
            document.createElement("div");

        message.className =
            `message ${type}`;


        const inner =
            document.createElement("div");

        inner.className =
            "message-inner";


        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";




        const bubble =
            document.createElement("div");

        bubble.className =
            "bubble";

        bubble.textContent =
            text;


        inner.appendChild(avatar);
        inner.appendChild(bubble);

        message.appendChild(inner);

        chatMessages.appendChild(message);


        requestAnimationFrame(() => {

            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: "smooth"
            });

        });


        return message;
    }


    /* =====================================================
       LOADING
       ===================================================== */

    function addLoadingMessage() {

        const message =
            document.createElement("div");

        message.className =
            "message bot typing";


        const inner =
            document.createElement("div");

        inner.className =
            "message-inner";


        const avatar =
            document.createElement("div");

        avatar.className =
            "message-avatar";


        const image =
            document.createElement("img");


        avatar.appendChild(image);


        const bubble =
            document.createElement("div");

        bubble.className =
            "bubble";


        bubble.innerHTML = `
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;


        inner.appendChild(avatar);
        inner.appendChild(bubble);

        message.appendChild(inner);

        chatMessages.appendChild(message);


        chatMessages.scrollTop =
            chatMessages.scrollHeight;


        return message;
    }


    /* =====================================================
       API GEMINI
       ===================================================== */

    async function askAI(message) {

        console.log(
            "🤖 Enviando pergunta para a IA..."
        );


        const response =
            await fetch(
                SUPPORT_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message
                        }),

                    cache:
                        "no-store"
                }
            );


        console.log(
            "📡 Resposta HTTP:",
            response.status
        );


        const raw =
            await response.text();


        let data = {};


        if (raw.trim()) {

            try {

                data =
                    JSON.parse(raw);

            } catch {

                console.error(
                    "❌ JSON inválido:",
                    raw
                );

                throw new Error(
                    "A API devolveu uma resposta inválida."
                );
            }
        }


        if (!response.ok) {

            console.error(
                "❌ Erro da API:",
                response.status,
                data
            );


            throw new Error(
                data?.message ||
                `Erro HTTP ${response.status}`
            );
        }


        if (!data.reply) {

            throw new Error(
                "A IA não devolveu uma resposta."
            );
        }


        console.log(
            "✅ Resposta da IA recebida."
        );


        return data.reply;
    }


    /* =====================================================
       ENVIAR
       ===================================================== */

    async function sendMessage() {

        const message =
            String(
                input.value || ""
            ).trim();


        if (!message) {

            input.focus();

            return;
        }


        if (message.length > 1200) {

            addMessage(
                "A sua mensagem é demasiado longa. Tente resumir a pergunta.",
                "bot"
            );

            return;
        }


        addMessage(
            message,
            "user"
        );


        input.value = "";

        updateCounter();
        resizeInput();


        sendButton.disabled =
            true;


        if (statusText) {

            statusText.textContent =
                "A preparar resposta...";
        }


        const loading =
            addLoadingMessage();


        try {

            const reply =
                await askAI(
                    message
                );


            if (loading) {
                loading.remove();
            }


            addMessage(
                reply,
                "bot"
            );


            if (statusText) {

                statusText.textContent =
                    "Pronto para ajudar";
            }


        } catch (error) {

            console.error(
                "❌ Erro ao contactar a IA:",
                error
            );


            if (loading) {
                loading.remove();
            }


            addMessage(
                "Não foi possível obter uma resposta neste momento. O serviço de IA pode estar temporariamente ocupado. Tente novamente em alguns instantes.",
                "bot"
            );


            if (statusText) {

                statusText.textContent =
                    "Serviço temporariamente indisponível";
            }


        } finally {

            sendButton.disabled =
                false;

            input.focus();

        }
    }


    /* =====================================================
       FORM
       ===================================================== */

    if (chatForm) {

        chatForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendMessage();

            }
        );
    }


    /* =====================================================
       ENTER
       ===================================================== */

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendMessage();
            }

        }
    );


    /* =====================================================
       AUTO RESIZE
       ===================================================== */

    function resizeInput() {

        input.style.height =
            "auto";

        input.style.height =
            Math.min(
                input.scrollHeight,
                125
            ) + "px";
    }


    input.addEventListener(
        "input",
        () => {

            updateCounter();

            resizeInput();

        }
    );


    /* =====================================================
       CONTADOR
       ===================================================== */

    function updateCounter() {

        if (!counter) {
            return;
        }

        counter.textContent =
            String(
                input.value.length
            );
    }


    /* =====================================================
       LIMPAR
       ===================================================== */

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                chatMessages.innerHTML =
                    "";

                showWelcomeMessage();

                if (statusText) {

                    statusText.textContent =
                        "Pronto para ajudar";
                }

                input.focus();

            }
        );
    }


    /* =====================================================
       PERGUNTAS RÁPIDAS
       ===================================================== */

    const quickButtons =
        document.querySelectorAll(
            "[data-question]"
        );


    quickButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const question =
                        button.dataset.question;


                    if (!question) {
                        return;
                    }


                    input.value =
                        question;


                    updateCounter();

                    resizeInput();

                    sendMessage();

                }
            );

        }
    );


    /* =====================================================
       TESTE INICIAL
       ===================================================== */

    showWelcomeMessage();

    updateCounter();

});