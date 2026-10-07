"use strict";

/* =========================================================
   TRADERS DE ELITE — SUPORTE IA
   VERCEL + GOOGLE GEMINI
   ========================================================= */

const SYSTEM_PROMPT = `
És o assistente virtual da TRADERS DE ELITE, uma comunidade
social, educativa e sem fins lucrativos.

Responde em português claro, natural e objetivo.

Podes ajudar com:

- informações sobre a comunidade;
- formações;
- inscrição;
- Portal do Estudante;
- funcionamento do site;
- utilização das páginas;
- dúvidas gerais sobre a TRADERS DE ELITE.

REGRAS:

1. Não inventes preços, horários, contactos, cursos ou regras.
2. Se não souberes uma informação, diz claramente que não tens
   essa informação e recomenda contactar a equipa.
3. Não dês recomendações financeiras personalizadas.
4. Não forneças sinais de compra ou venda.
5. Não prometas lucros.
6. Não apresentes especulação financeira como facto.
7. Mantém as respostas claras e relativamente curtas.
`;


/* =========================================================
   CONHECIMENTO DA TRADERS DE ELITE
   ========================================================= */

const KNOWLEDGE = `
TRADERS DE ELITE:

- Comunidade de carácter social, educativo e sem fins lucrativos.
- Atua em educação financeira.
- Literacia económica.
- Mercados financeiros.
- Empreendedorismo.
- Desenvolvimento pessoal.
- Valores: disciplina, estratégia e consistência.

PÁGINAS DO SITE:

- Sobre
- Formação
- Sala Virtual
- Market Desk
- Comunidade
- Parceiros
- Transparência
- Suporte IA

Também existe um Portal do Estudante.

O suporte de IA fornece informações gerais sobre a comunidade
e utilização do site.

CONTACTO:

Telefone:
938979330

O assistente não deve inventar outros contactos.
`;


/* =========================================================
   FUNÇÃO PRINCIPAL
   ========================================================= */

export default async function handler(req, res) {

    /* =====================================================
       CORS
       ===================================================== */

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


    /* =====================================================
       PREFLIGHT
       ===================================================== */

    if (req.method === "OPTIONS") {

        return res.status(204).end();

    }


    /* =====================================================
       ACEITAR GET E POST
       ===================================================== */

    if (
        req.method !== "GET" &&
        req.method !== "POST"
    ) {

        return res.status(405).json({

            message:
                "Método não permitido."

        });

    }


    /* =====================================================
       OBTER MENSAGEM
       ===================================================== */

    let message = "";


    /* -----------------------------------------------------
       POST
       ----------------------------------------------------- */

    if (req.method === "POST") {

        message = String(
            req.body?.message || ""
        ).trim();

    }


    /* -----------------------------------------------------
       GET
       ----------------------------------------------------- */

    if (req.method === "GET") {

        message = String(
            req.query?.message || ""
        ).trim();

    }


    /* =====================================================
       VALIDAR
       ===================================================== */

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


    /* =====================================================
       API KEY
       ===================================================== */

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


    /* =====================================================
       MODELO
       ===================================================== */

    const model =
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash";


    /* =====================================================
       URL GEMINI
       ===================================================== */

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;


    /* =====================================================
       GEMINI
       ===================================================== */

    try {

        const response =
            await fetch(url, {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "x-goog-api-key":
                        apiKey

                },

                body: JSON.stringify({

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

                        temperature: 0.3,

                        maxOutputTokens: 500

                    }

                })

            });


        /* =================================================
           LER RESPOSTA
           ================================================= */

        const raw =
            await response.text();


        let data = null;


        if (raw.trim()) {

            try {

                data =
                    JSON.parse(raw);

            } catch (error) {

                console.error(
                    "Gemini devolveu resposta não JSON:",
                    raw
                );

                return res.status(502).json({

                    message:
                        "O serviço de IA devolveu uma resposta inválida."

                });

            }

        }


        /* =================================================
           ERRO GEMINI
           ================================================= */

        if (!response.ok) {

            console.error(
                "Erro Gemini:",
                response.status,
                data
            );


            return res.status(502).json({

                message:
                    data?.error?.message ||
                    "O serviço Gemini não respondeu corretamente."

            });

        }


        /* =================================================
           EXTRAIR TEXTO
           ================================================= */

        const reply =
            data
                ?.candidates?.[0]
                ?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();


        if (!reply) {

            console.error(
                "Gemini não devolveu texto:",
                JSON.stringify(data)
            );


            return res.status(502).json({

                message:
                    "A IA não devolveu uma resposta."

            });

        }


        /* =================================================
           SUCESSO
           ================================================= */

        return res.status(200).json({

            reply: reply

        });


    } catch (error) {

        console.error(
            "Erro interno Gemini:",
            error
        );


        return res.status(500).json({

            message:
                "Erro interno no suporte de IA."

        });

    }

}
