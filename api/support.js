"use strict";

const SYSTEM_PROMPT = `
Você é o assistente oficial de suporte da TRADERS DE ELITE.

A TRADERS DE ELITE é uma comunidade de educação financeira e desenvolvimento juvenil.

Sua função é:
- ajudar visitantes e estudantes;
- explicar como funciona a plataforma;
- orientar sobre cadastro e acesso;
- explicar cursos e aulas;
- ajudar com problemas comuns do portal;
- responder de forma clara, curta e profissional.

Não invente informações.
Se não souber algo específico sobre a plataforma, diga claramente que o utilizador deve contactar o suporte humano.

Responda sempre em português.
`;

const KNOWLEDGE = `
INFORMAÇÕES DA PLATAFORMA:

Nome:
TRADERS DE ELITE

Descrição:
Comunidade de Educação Financeira e Desenvolvimento Juvenil.

A plataforma possui:
- cursos;
- módulos;
- aulas;
- área do estudante;
- Market Desk;
- comunidade;
- eventos;
- informações institucionais;
- sistema de certificados.

Portal do estudante:
https://www.tradersdeelite.school/portal/login.html

Site:
https://www.tradersdeelite.school

O assistente não deve solicitar senhas, códigos de recuperação ou chaves de API.
`;

export default async function handler(req, res) {

    // ==============================
    // CORS
    // ==============================

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Accept"
    );

    // ==============================
    // PREFLIGHT
    // ==============================

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    // ==============================
    // API KEY
    // ==============================

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {

        console.error(
            "GEMINI_API_KEY não configurada."
        );

        return res.status(500).json({
            message:
                "A IA ainda não está configurada no servidor."
        });
    }

    // ==============================
    // RECEBER MENSAGEM
    // ==============================

    let message = "";

    if (req.method === "POST") {

        message =
            req.body?.message || "";

    } else if (req.method === "GET") {

        message =
            req.query?.message || "";

    } else {

        return res.status(405).json({
            message:
                "Método não permitido."
        });
    }

    message =
        String(message)
            .trim();

    if (!message) {

        return res.status(400).json({
            message:
                "Escreva uma mensagem."
        });
    }

    if (message.length > 1200) {

        return res.status(400).json({
            message:
                "A mensagem é demasiado longa."
        });
    }

    // ==============================
    // MODELO
    // ==============================

    const model =
        process.env.GEMINI_MODEL ||
        "gemini-3.8-flash";

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    console.log(
        "🤖 Consultando Gemini:",
        model
    );

    // ==============================
    // REQUEST GEMINI
    // ==============================

    try {

        const controller =
            new AbortController();

        const timeout =
            setTimeout(
                () => controller.abort(),
                25000
            );

        const response =
            await fetch(
                url,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-goog-api-key":
                            apiKey
                    },

                    body:
                        JSON.stringify({

                            systemInstruction: {
                                parts: [
                                    {
                                        text:
                                            SYSTEM_PROMPT
                                    }
                                ]
                            },

                            contents: [
                                {
                                    role: "user",

                                    parts: [
                                        {
                                            text:
                                                `${KNOWLEDGE}

Pergunta do utilizador:

${message}`
                                        }
                                    ]
                                }
                            ],

                            generationConfig: {
                                maxOutputTokens: 500
                            }

                        }),

                    signal:
                        controller.signal
                }
            );

        clearTimeout(timeout);

        const raw =
            await response.text();

        console.log(
            "Gemini HTTP:",
            response.status
        );

        console.log(
            "Gemini resposta:",
            raw.slice(0, 1000)
        );

        let data;

        try {

            data =
                JSON.parse(raw);

        } catch {

            return res.status(502).json({
                message:
                    "O Gemini devolveu uma resposta inválida."
            });
        }

        // ==============================
        // ERRO GEMINI
        // ==============================

        if (!response.ok) {

            console.error(
                "Erro Gemini:",
                data
            );

            return res.status(502).json({
                message:
                    data?.error?.message ||
                    "O serviço de IA não respondeu corretamente."
            });
        }

        // ==============================
        // EXTRAIR RESPOSTA
        // ==============================

        const reply =
            data?.candidates?.[0]
                ?.content?.parts
                ?.map(
                    part =>
                        part.text || ""
                )
                .join("")
                .trim();

        if (!reply) {

            console.error(
                "Gemini não devolveu texto:",
                data
            );

            return res.status(502).json({
                message:
                    "A IA não devolveu uma resposta."
            });
        }

        // ==============================
        // SUCESSO
        // ==============================

        console.log(
            "✅ Resposta Gemini recebida."
        );

        return res.status(200).json({
            reply
        });

    } catch (error) {

        console.error(
            "❌ Erro Gemini:",
            error
        );

        if (
            error?.name ===
            "AbortError"
        ) {

            return res.status(504).json({
                message:
                    "A IA demorou demasiado para responder. Tente novamente."
            });
        }

        return res.status(500).json({
            message:
                "Erro interno ao contactar a IA."
        });
    }
}
