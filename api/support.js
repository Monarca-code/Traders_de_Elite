const SYSTEM_PROMPT = `
És o assistente virtual de suporte da Traders de Elite, uma comunidade social, educativa e sem fins lucrativos.
Responde em português claro, curto e objetivo.
Podes ajudar com: informações sobre a comunidade, formação, inscrição, portal do estudante, páginas do site e dúvidas gerais de utilização.
Não inventes preços, horários, contactos, cursos ou regras que não estejam nas informações fornecidas.
Se não souberes uma informação, diz claramente que não tens essa informação e recomenda contactar a equipa.
Não dês recomendações financeiras personalizadas, sinais de compra/venda ou promessas de lucro.
`;

const KNOWLEDGE = `
TRADERS DE ELITE:
- É uma comunidade de carácter social, educativo e sem fins lucrativos.
- Atua em educação financeira, literacia económica, mercados financeiros, empreendedorismo e desenvolvimento pessoal.
- Valores destacados: disciplina, estratégia, consistência e desenvolvimento de competências.
- O site possui páginas de Sobre, Formação, Sala Virtual, Market Desk, Comunidade, Parceiros e Transparência.
- Existe Portal do Estudante para funcionalidades destinadas aos estudantes.
- A página de suporte é apenas um assistente informativo.
- Seu email trdadersdeelit2026
- Seu contacto 938979330
`;

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Método não permitido." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ message: "A IA ainda não está configurada no servidor." });
    }

    const message = String(req.body?.message || "").trim();
    if (!message || message.length > 1200) {
        return res.status(400).json({ message: "Mensagem inválida." });
    }

    try {
        const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{
                    role: "user",
                    parts: [{ text: `${KNOWLEDGE}\n\nPergunta do utilizador:\n${message}` }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini error:", data);
            return res.status(502).json({ message: "O serviço de IA não respondeu corretamente." });
        }

        const reply = data?.candidates?.[0]?.content?.parts
            ?.map(part => part.text || "")
            .join("")
            .trim();

        if (!reply) {
            return res.status(502).json({ message: "A IA não devolveu uma resposta." });
        }

        return res.status(200).json({ reply });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro interno no suporte." });
    }
}
