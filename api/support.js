const SYSTEM_PROMPT = `
És o assistente virtual da TRADERS DE ELITE, uma comunidade social,
educativa e sem fins lucrativos.

Responde em português claro, natural, curto e objetivo.

Podes ajudar com:
- informações sobre a comunidade;
- formações;
- inscrição;
- Portal do Estudante;
- funcionamento do site;
- utilização das páginas;
- dúvidas gerais sobre a TRADERS DE ELITE.

Não inventes preços, horários, contactos, cursos ou regras.

Se não souberes uma informação, diz claramente que não tens essa
informação e recomenda contactar a equipa.

Não dês recomendações financeiras personalizadas.
Não forneças sinais de compra ou venda.
Não prometas lucros.
Não apresentes informação financeira especulativa como facto.
`;

const KNOWLEDGE = `
TRADERS DE ELITE:

- Comunidade de carácter social, educativo e sem fins lucrativos.
- Atua em educação financeira.
- Literacia económica.
- Mercados financeiros.
- Empreendedorismo.
- Desenvolvimento pessoal.
- Valores: disciplina, estratégia e consistência.
- O site possui páginas de Sobre, Formação, Sala Virtual,
  Market Desk, Comunidade, Parceiros, Transparência e Suporte IA.
- Existe um Portal do Estudante.
- A página de suporte utiliza inteligência artificial apenas
  para suporte informativo.

Contacto:
- Telefone: 938979330

O assistente não deve inventar outros contactos.
`;

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            message: "Método não permitido."
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("GEMINI_API_KEY não configurada.");

        return res.status(500).json({
            message: "A IA ainda não está configurada no servidor."
        });
    }

    const message = String(
        req.body?.message || ""
    ).trim();

    if (!message) {
        return res.status(400).json({
            message: "Escreva uma mensagem."
        });
    }

    if (message.length > 1200) {
        return res.status(400).json({
            message: "A mensagem é demasiado longa."
        });
    }

    try {

        const model =
            process.env.GEMINI_MODEL ||
            "gemini-2.5-flash";

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },

            body: JSON.stringify({

                systemInstruction: {
                    parts: [
                        {
                            text: SYSTEM_PROMPT
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

        const data = await response.json();

        if (!response.ok) {

            console.error(
                "Erro Gemini:",
                JSON.stringify(data)
            );

            return res.status(502).json({
                message:
                    "O serviço de IA não respondeu corretamente."
            });
        }

        const reply =
            data?.candidates?.[0]?.content?.parts
                ?.map(part => part.text || "")
                .join("")
                .trim();

        if (!reply) {

            console.error(
                "Resposta Gemini sem texto:",
                JSON.stringify(data)
            );

            return res.status(502).json({
                message:
                    "A IA não devolveu uma resposta."
            });
        }

        return res.status(200).json({
            reply
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
