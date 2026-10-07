"use strict";

/* =========================================================
   TRADERS DE ELITE
   SUPORTE IA — FRONTEND
   ========================================================= */


/*
 * IMPORTANTE:
 *
 * Não usamos /api/support aqui porque o utilizador pode
 * estar a testar o site através do Live Server:
 *
 * http://127.0.0.1:5501
 *
 * A API está publicada na Vercel.
 */

const SUPPORT_API_URL =
    "https://www.tradersdeelite.school/api/support";


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           ELEMENTOS
           ================================================= */

        const input =
            document.querySelector("#messageInput") ||
            document.querySelector("#message-input") ||
            document.querySelector("#userMessage") ||
            document.querySelector("#pergunta") ||
            document.querySelector("textarea");


        const sendButton =
            document.querySelector("#sendButton") ||
            document.querySelector("#send-button") ||
            document.querySelector("#btnEnviar") ||
            document.querySelector("#enviar") ||
            document.querySelector(
                'button[type="submit"]'
            );


        const clearButton =
            document.querySelector("#clearChat") ||
            document.querySelector("#clear-chat") ||
            document.querySelector("#limpar") ||
            document.querySelector(".btn-clear");


        const chatMessages =
            document.querySelector("#chatMessages") ||
            document.querySelector("#chat-messages") ||
            document.querySelector(".chat-messages") ||
            document.querySelector("#messages");


        /* =================================================
           VERIFICAR INPUT
           ================================================= */

        if (!input) {

            console.error(
                "❌ Campo de mensagem não encontrado."
            );

            return;

        }


        console.log(
            "✅ Suporte IA carregado."
        );


        /* =================================================
           ADICIONAR MENSAGEM
           ================================================= */

        function addMessage(
            text,
            type = "assistant"
        ) {

            if (!chatMessages) {

                console.warn(
                    "Container de mensagens não encontrado."
                );

                return null;

            }


            const message =
                document.createElement("div");


            message.className =
                `chat-message ${type}`;


            const content =
                document.createElement("div");


            content.className =
                "chat-message-content";


            content.textContent =
                text;


            message.appendChild(
                content
            );


            chatMessages.appendChild(
                message
            );


            chatMessages.scrollTop =
                chatMessages.scrollHeight;


            return message;

        }


        /* =================================================
           LOADING
           ================================================= */

        function addLoadingMessage() {

            if (!chatMessages) {

                return null;

            }


            const message =
                document.createElement("div");


            message.className =
                "chat-message assistant loading";


            const content =
                document.createElement("div");


            content.className =
                "chat-message-content";


            content.innerHTML = `
                <span class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            `;


            message.appendChild(
                content
            );


            chatMessages.appendChild(
                message
            );


            chatMessages.scrollTop =
                chatMessages.scrollHeight;


            return message;

        }


        /* =================================================
           PERGUNTAR À IA
           ================================================= */

        async function askAI(message) {

            console.log(
                "🤖 Enviando pergunta para a IA..."
            );


            try {

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

                                    message:
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

                    } catch (error) {

                        console.error(
                            "❌ Resposta inválida:",
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


            } catch (error) {

                console.error(
                    "❌ Erro ao contactar a IA:",
                    error
                );


                throw error;

            }

        }


        /* =================================================
           ENVIAR MENSAGEM
           ================================================= */

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

                    "assistant"

                );

                return;

            }


            /* ---------------------------------------------
               MENSAGEM DO UTILIZADOR
               --------------------------------------------- */

            addMessage(
                message,
                "user"
            );


            input.value = "";


            /* ---------------------------------------------
               BLOQUEAR BOTÃO
               --------------------------------------------- */

            if (sendButton) {

                sendButton.disabled =
                    true;

            }


            /* ---------------------------------------------
               LOADING
               --------------------------------------------- */

            const loading =
                addLoadingMessage();


            try {

                const reply =
                    await askAI(message);


                if (loading) {

                    loading.remove();

                }


                addMessage(
                    reply,
                    "assistant"
                );


            } catch (error) {

                if (loading) {

                    loading.remove();

                }


                addMessage(

                    "Não foi possível ligar ao assistente neste momento. Tente novamente em instantes.",

                    "assistant"

                );

            } finally {

                if (sendButton) {

                    sendButton.disabled =
                        false;

                }


                input.focus();

            }

        }


        /* =================================================
           BOTÃO ENVIAR
           ================================================= */

        if (sendButton) {

            sendButton.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    sendMessage();

                }
            );

        }


        /* =================================================
           ENTER
           ================================================= */

        input.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );


        /* =================================================
           LIMPAR CHAT
           ================================================= */

        if (clearButton) {

            clearButton.addEventListener(
                "click",
                () => {

                    if (!chatMessages) {

                        return;

                    }


                    chatMessages.innerHTML =
                        "";


                    addMessage(

                        "Olá! Sou o assistente da TRADERS DE ELITE. Posso ajudar com dúvidas sobre a comunidade, formações, inscrição, Portal do Estudante e utilização do site. O que gostaria de saber?",

                        "assistant"

                    );

                }
            );

        }


        /* =================================================
           PERGUNTAS RÁPIDAS
           ================================================= */

        const quickButtons =
            document.querySelectorAll(
                "[data-question]"
            );


        quickButtons.forEach(
            (button) => {

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


                        sendMessage();

                    }
                );

            }
        );


    }
);
