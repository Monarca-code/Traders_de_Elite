/*
 * TRADERS DE ELITE — Market Data
 * Appwrite Function + Twelve Data
 *
 * A API key do Twelve Data NUNCA deve ser colocada no frontend.
 * Configure TWELVE_DATA_API_KEY como variável secreta da Function.
 */

const TWELVE_DATA_BASE = "https://api.twelvedata.com";

const ALLOWED_SYMBOLS = new Set([
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "XAU/USD",
    "BTC/USD"
]);

const ALLOWED_INTERVALS = new Set([
    "5min",
    "15min",
    "1h",
    "4h",
    "1day"
]);

const WATCHLIST = [
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "XAU/USD",
    "BTC/USD"
];

function jsonError(res, status, message) {
    return res.json({
        status: "error",
        message
    }, status);
}

function normalizeQuote(symbol, quote) {
    if (!quote || quote.status === "error") {
        return {
            symbol,
            price: null,
            change: null,
            open: null,
            high: null,
            low: null,
            close: null,
            error: quote?.message || "Quote indisponível"
        };
    }

    return {
        symbol,
        price: Number(quote.close ?? quote.price),
        change: Number(quote.percent_change ?? quote.change_percent ?? 0),
        open: Number(quote.open),
        high: Number(quote.high),
        low: Number(quote.low),
        close: Number(quote.close),
        previousClose: Number(quote.previous_close)
    };
}

export default async ({ req, res, log, error }) => {
    try {
        const apiKey = process.env.TWELVE_DATA_API_KEY;

        if (!apiKey) {
            error("TWELVE_DATA_API_KEY não configurada.");
            return jsonError(res, 500, "API de mercado não configurada no servidor.");
        }

        let input = {};

        if (req.bodyJson && typeof req.bodyJson === "object") {
            input = req.bodyJson;
        } else if (req.bodyText) {
            try {
                input = JSON.parse(req.bodyText);
            } catch {
                input = {};
            }
        }

        const symbol = String(input.symbol || "EUR/USD").toUpperCase();
        const interval = String(input.interval || "5min");

        if (!ALLOWED_SYMBOLS.has(symbol)) {
            return jsonError(res, 400, "Ativo não permitido.");
        }

        if (!ALLOWED_INTERVALS.has(interval)) {
            return jsonError(res, 400, "Timeframe não permitido.");
        }

        /*
         * Cinco quotes + uma série histórica.
         * Cada endpoint /quote e /time_series pesa 1 crédito
         * para estes símbolos no plano Basic.
         */
        const watchlist = await Promise.all(
            WATCHLIST.map(async item => {
                const quoteUrl = new URL(`${TWELVE_DATA_BASE}/quote`);
                quoteUrl.searchParams.set("symbol", item);
                quoteUrl.searchParams.set("apikey", apiKey);

                const response = await fetch(quoteUrl);
                const data = await response.json();

                if (!response.ok || data.status === "error") {
                    log(`Quote ${item} indisponível: ${data.message || response.status}`);
                    return normalizeQuote(item, data);
                }

                return normalizeQuote(item, data);
            })
        );

        const seriesUrl = new URL(`${TWELVE_DATA_BASE}/time_series`);
        seriesUrl.searchParams.set("symbol", symbol);
        seriesUrl.searchParams.set("interval", interval);
        seriesUrl.searchParams.set("outputsize", "120");
        seriesUrl.searchParams.set("apikey", apiKey);

        const seriesResponse = await fetch(seriesUrl);
        const seriesData = await seriesResponse.json();

        if (!seriesResponse.ok || seriesData.status === "error") {
            error(`Twelve Data time_series: ${seriesData.message || seriesResponse.status}`);
            return jsonError(res, 502, "Não foi possível carregar o histórico do ativo.");
        }

        const candles = Array.isArray(seriesData.values)
            ? seriesData.values
                .map(item => ({
                    time: Math.floor(new Date(item.datetime).getTime() / 1000),
                    open: Number(item.open),
                    high: Number(item.high),
                    low: Number(item.low),
                    close: Number(item.close)
                }))
                .filter(item =>
                    Number.isFinite(item.time) &&
                    Number.isFinite(item.open) &&
                    Number.isFinite(item.high) &&
                    Number.isFinite(item.low) &&
                    Number.isFinite(item.close)
                )
                .sort((a, b) => a.time - b.time)
            : [];

        const selected = watchlist.find(item => item.symbol === symbol);

        log(`Market data: ${symbol} / ${interval} / ${candles.length} candles`);

        return res.json({
            status: "ok",
            source: "Twelve Data",
            updatedAt: new Date().toISOString(),
            symbol,
            interval,
            price: selected?.price ?? null,
            change: selected?.change ?? null,
            open: selected?.open ?? null,
            high: selected?.high ?? null,
            low: selected?.low ?? null,
            close: selected?.close ?? null,
            watchlist,
            candles
        });

    } catch (err) {
        error(err?.stack || String(err));
        return jsonError(res, 500, "Erro interno ao consultar o mercado.");
    }
};
