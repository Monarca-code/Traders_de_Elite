"use strict";

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            message: "Use GET para este teste."
        });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            message: "GEMINI_API_KEY não configurada."
        });
    }

    const model =
        process.env.GEMINI_MODEL ||
        "gemini-3.8-flash";

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {

        console.log("🧪 TESTE GEMINI");
        console.log("Modelo:", model);

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey
            },

            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: "Responda apenas: OK"
                            }
                        ]
                    }
                ]
            })
        });

        const text =
            await response.text();

        console.log(
            "Gemini HTTP:",
            response.status
        );

        console.log(
            "Gemini:",
            text
        );

        return res.status(200).json({
            httpStatus: response.status,
            model,
            response: text
        });

    } catch (error) {

        console.error(
            "Erro:",
            error
        );

        return res.status(500).json({
            message:
                error?.message ||
                "Erro ao contactar Gemini."
        });
    }
}
