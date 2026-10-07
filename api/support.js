"use strict";

export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            message: "Use GET para este teste."
        });
    }

    const apiKey =
        process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            message: "GEMINI_API_KEY não configurada."
        });
    }

    try {

        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models",
            {
                method: "GET",
                headers: {
                    "x-goog-api-key": apiKey
                }
            }
        );

        const raw =
            await response.text();

        let data;

        try {
            data = JSON.parse(raw);
        } catch {
            return res.status(502).json({
                message: "Resposta inválida do Google.",
                raw: raw.slice(0, 1000)
            });
        }

        if (!response.ok) {

            return res.status(response.status).json({
                message:
                    data?.error?.message ||
                    "Não foi possível obter os modelos.",
                googleStatus:
                    data?.error?.status
            });
        }

        const models =
            Array.isArray(data.models)
                ? data.models
                : [];

        const usable =
            models
                .filter(model =>
                    Array.isArray(
                        model.supportedGenerationMethods
                    ) &&
                    model.supportedGenerationMethods
                        .includes("generateContent")
                )
                .map(model => ({
                    name: model.name,
                    displayName:
                        model.displayName,
                    description:
                        model.description,
                    inputTokenLimit:
                        model.inputTokenLimit,
                    outputTokenLimit:
                        model.outputTokenLimit
                }));

        return res.status(200).json({
            status: "ok",
            total: usable.length,
            models: usable
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            message:
                error?.message ||
                "Erro ao consultar os modelos Gemini."
        });
    }
}
