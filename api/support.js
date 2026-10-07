"use strict";

export default async function handler(req, res) {

    console.log("API SUPPORT EXECUTADA");

    return res.status(200).json({
        status: "ok",
        message: "API funcionando corretamente.",
        method: req.method,
        time: new Date().toISOString()
    });
}
