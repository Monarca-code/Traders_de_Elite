/* =========================================================
   TRADERS DE ELITE — MARKET DESK
   Dados reais via Appwrite Function + Twelve Data
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURAÇÃO
   ========================================================= */

const MARKET_CONFIG = {

    functionUrl:
        "https://starter-function-tplw.fra.appwrite.run",

    defaultSymbol:
        "EUR/USD",

    defaultInterval:
        "5min",

    // Atualização do gráfico
    liveRefreshInterval:
        60000,

    // Atualização da watchlist
    watchlistRefreshInterval:
        300000
};


let selectedSymbol =
    MARKET_CONFIG.defaultSymbol;


let selectedInterval =
    MARKET_CONFIG.defaultInterval;


let chart = null;

let candlestickSeries = null;

let liveRefreshTimer = null;

let watchlistRefreshTimer = null;

let requestInProgress = false;

let watchlistRequestInProgress = false;

let chartInitialized = false;


/* =========================================================
   ELEMENTOS
   ========================================================= */

const chartContainer =
    document.getElementById("marketChart");

const chartLoading =
    document.getElementById("chartLoading");

const selectedSymbolElement =
    document.getElementById("selectedSymbol");

const selectedPriceElement =
    document.getElementById("selectedPrice");

const selectedChangeElement =
    document.getElementById("selectedChange");

const marketStatus =
    document.getElementById("marketStatus");

const marketStatusDot =
    document.getElementById("marketStatusDot");

const lastUpdate =
    document.getElementById("lastUpdate");

const chartSource =
    document.getElementById("chartSource");

const openPrice =
    document.getElementById("openPrice");

const highPrice =
    document.getElementById("highPrice");

const lowPrice =
    document.getElementById("lowPrice");

const closePrice =
    document.getElementById("closePrice");


/* =========================================================
   GRÁFICO
   ========================================================= */

function createMarketChart() {

    if (!chartContainer) {

        console.warn(
            "Container #marketChart não encontrado."
        );

        return;
    }


    if (
        typeof LightweightCharts ===
        "undefined"
    ) {

        console.error(
            "Lightweight Charts não carregado."
        );

        return;
    }


    chart =
        LightweightCharts.createChart(
            chartContainer,
            {

                autoSize: true,

                layout: {

                    background: {
                        type: "solid",
                        color: "#080808"
                    },

                    textColor: "#9b9ba3"
                },


                grid: {

                    vertLines: {
                        color:
                            "rgba(255,255,255,.04)"
                    },

                    horzLines: {
                        color:
                            "rgba(255,255,255,.04)"
                    }
                },


                crosshair: {

                    mode:
                        LightweightCharts
                            .CrosshairMode
                            .Normal
                },


                rightPriceScale: {

                    borderColor:
                        "rgba(255,255,255,.08)"
                },


                timeScale: {

                    borderColor:
                        "rgba(255,255,255,.08)",

                    timeVisible: true,

                    secondsVisible: false
                }
            }
        );


    candlestickSeries =
        chart.addSeries(
            LightweightCharts.CandlestickSeries,
            {

                upColor:
                    "#d4af37",

                downColor:
                    "#777777",

                borderVisible:
                    false,

                wickUpColor:
                    "#d4af37",

                wickDownColor:
                    "#777777"
            }
        );
}


/* =========================================================
   FORMATAÇÃO
   ========================================================= */

function formatPrice(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "—";
    }


    const number =
        Number(value);


    if (number >= 1000) {

        return number.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    if (number >= 10) {

        return number.toFixed(3);
    }


    if (number >= 1) {

        return number.toFixed(5);
    }


    return number.toFixed(6);
}



function formatChange(value) {

    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "—";
    }


    const number =
        Number(value);


    return `${
        number >= 0 ? "+" : ""
    }${number.toFixed(2)}%`;
}


/* =========================================================
   STATUS
   ========================================================= */

function setMarketStatus(
    online,
    message
) {

    if (marketStatus) {

        marketStatus.textContent =
            message;
    }


    marketStatusDot?.classList.toggle(
        "online",
        online
    );


    marketStatusDot?.classList.toggle(
        "offline",
        !online
    );
}



function showChartLoading(show) {

    if (!chartLoading) {

        return;
    }


    chartLoading.style.display =
        show ? "flex" : "none";
}


/* =========================================================
   WATCHLIST
   ========================================================= */

function updateAssetCard(item) {

    if (
        !item ||
        !item.symbol
    ) {

        return;
    }


    const priceElement =
        document.querySelector(
            `[data-price="${item.symbol}"]`
        );


    const changeElement =
        document.querySelector(
            `[data-change="${item.symbol}"]`
        );


    if (priceElement) {

        priceElement.textContent =
            formatPrice(
                item.price
            );
    }


    if (changeElement) {

        const change =
            Number(item.change);


        changeElement.textContent =
            formatChange(change);


        changeElement.classList.toggle(
            "positive",
            change >= 0
        );


        changeElement.classList.toggle(
            "negative",
            change < 0
        );
    }
}


/* =========================================================
   MERCADO SELECIONADO
   ========================================================= */

function updateSelectedMarket(data) {

    if (!data) {

        return;
    }


    const price =
        Number(
            data.price ??
            data.close
        );


    const change =
        Number(
            data.change ?? 0
        );


    if (selectedSymbolElement) {

        selectedSymbolElement.textContent =
            selectedSymbol;
    }


    if (selectedPriceElement) {

        selectedPriceElement.textContent =
            formatPrice(price);
    }


    if (selectedChangeElement) {

        selectedChangeElement.textContent =
            formatChange(change);


        selectedChangeElement.classList.toggle(
            "positive",
            change >= 0
        );


        selectedChangeElement.classList.toggle(
            "negative",
            change < 0
        );
    }


    if (openPrice) {

        openPrice.textContent =
            formatPrice(data.open);
    }


    if (highPrice) {

        highPrice.textContent =
            formatPrice(data.high);
    }


    if (lowPrice) {

        lowPrice.textContent =
            formatPrice(data.low);
    }


    if (closePrice) {

        closePrice.textContent =
            formatPrice(data.close);
    }


    if (lastUpdate) {

        lastUpdate.textContent =
            `Atualizado ${new Date().toLocaleTimeString(
                "pt-AO",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"
                }
            )}`;
    }
}


/* =========================================================
   NORMALIZAR CANDLES
   ========================================================= */

function normalizeCandles(values) {

    if (!Array.isArray(values)) {

        return [];
    }


    return values

        .map(item => {

            let time;


            if (
                typeof item.time ===
                "number"
            ) {

                time =
                    Math.floor(
                        item.time
                    );

            } else if (
                typeof item.time ===
                    "string" &&
                /^\d+$/.test(
                    item.time
                )
            ) {

                time =
                    Number(item.time);

            } else if (
                item.datetime
            ) {

                time =
                    Math.floor(
                        new Date(
                            item.datetime
                        ).getTime() / 1000
                    );

            } else {

                time = NaN;
            }


            return {

                time,

                open:
                    Number(item.open),

                high:
                    Number(item.high),

                low:
                    Number(item.low),

                close:
                    Number(item.close)
            };
        })


        .filter(item =>

            Number.isFinite(
                item.time
            ) &&

            Number.isFinite(
                item.open
            ) &&

            Number.isFinite(
                item.high
            ) &&

            Number.isFinite(
                item.low
            ) &&

            Number.isFinite(
                item.close
            )
        )


        .sort(
            (a, b) =>
                a.time - b.time
        );
}


/* =========================================================
   REQUEST GENÉRICO
   ========================================================= */

async function requestMarket(mode) {

    const url =
        `${MARKET_CONFIG.functionUrl}` +
        `?symbol=${encodeURIComponent(
            selectedSymbol
        )}` +
        `&interval=${encodeURIComponent(
            selectedInterval
        )}` +
        `&mode=${encodeURIComponent(
            mode
        )}`;


    console.log(
        `📊 Market Desk → ${mode}`,
        selectedSymbol,
        selectedInterval
    );


    const response =
        await fetch(
            url,
            {
                method: "GET",

                headers: {
                    "Accept":
                        "application/json"
                },

                cache:
                    "no-store"
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            `Resposta inválida da Function. HTTP ${response.status}`
        );
    }


    if (!response.ok) {

        const message =
            data?.details ||
            data?.message ||
            `HTTP ${response.status}`;


        const requestError =
            new Error(
                `HTTP ${response.status}: ${message}`
            );


        requestError.status =
            response.status;


        requestError.code =
            data?.code;


        throw requestError;
    }


    if (
        !data ||
        data.status !== "ok"
    ) {

        const requestError =
            new Error(
                data?.message ||
                "API de mercado retornou erro."
            );


        requestError.code =
            data?.code;


        throw requestError;
    }


    return data;
}


/* =========================================================
   CARGA COMPLETA
   ========================================================= */

async function fetchMarketData() {

    if (requestInProgress) {

        return;
    }


    requestInProgress =
        true;


    showChartLoading(true);


    setMarketStatus(
        true,
        "A atualizar dados do mercado..."
    );


    try {

        const data =
            await requestMarket(
                "full"
            );


        console.log(
            "📈 Dados completos:",
            data
        );


        /*
         * WATCHLIST
         */

        if (
            Array.isArray(
                data.watchlist
            )
        ) {

            data.watchlist.forEach(
                updateAssetCard
            );
        }


        /*
         * MERCADO SELECIONADO
         */

        updateSelectedMarket(
            data
        );


        /*
         * CANDLES
         */

        const candles =
            normalizeCandles(
                data.candles
            );


        if (
            candlestickSeries &&
            candles.length > 0
        ) {

            candlestickSeries.setData(
                candles
            );


            chart
                ?.timeScale()
                .fitContent();


            chartInitialized =
                true;
        }


        setMarketStatus(
            true,
            "Dados de mercado atualizados"
        );


        if (chartSource) {

            chartSource.textContent =
                "Fonte: Twelve Data";
        }

    } catch (error) {

        handleMarketError(
            error
        );

    } finally {

        requestInProgress =
            false;


        showChartLoading(
            false
        );
    }
}


/* =========================================================
   ATUALIZAÇÃO LIVE
   ========================================================= */

async function refreshLiveMarket() {

    if (
        requestInProgress ||
        document.hidden
    ) {

        return;
    }


    requestInProgress =
        true;


    try {

        const data =
            await requestMarket(
                "live"
            );


        console.log(
            "⚡ Market Desk LIVE:",
            data
        );


        /*
         * Atualiza preço,
         * variação e OHLC.
         */

        updateSelectedMarket(
            data
        );


        /*
         * Atualiza candle.
         */

        const candles =
            normalizeCandles(
                data.candles
            );


        if (
            candlestickSeries &&
            candles.length > 0
        ) {

            const latestCandle =
                candles[
                    candles.length - 1
                ];


            /*
             * Se o gráfico ainda não
             * estiver inicializado,
             * fazemos carga completa.
             */

            if (!chartInitialized) {

                requestInProgress =
                    false;

                await fetchMarketData();

                return;
            }


            candlestickSeries.update(
                latestCandle
            );


            chart
                ?.timeScale()
                .scrollToRealTime();
        }


        setMarketStatus(
            true,
            "Mercado ao vivo • atualizado"
        );


        if (chartSource) {

            chartSource.textContent =
                "Fonte: Twelve Data";
        }

    } catch (error) {

        handleMarketError(
            error
        );

    } finally {

        requestInProgress =
            false;
    }
}


/* =========================================================
   ATUALIZAR WATCHLIST
   ========================================================= */

async function refreshWatchlist() {

    if (
        watchlistRequestInProgress ||
        document.hidden
    ) {

        return;
    }


    watchlistRequestInProgress =
        true;


    try {

        const data =
            await requestMarket(
                "watchlist"
            );


        console.log(
            "📋 Watchlist atualizada:",
            data
        );


        if (
            Array.isArray(
                data.watchlist
            )
        ) {

            data.watchlist.forEach(
                updateAssetCard
            );
        }

    } catch (error) {

        console.error(
            "❌ Watchlist:",
            error
        );

    } finally {

        watchlistRequestInProgress =
            false;
    }
}


/* =========================================================
   ERROS
   ========================================================= */

function handleMarketError(error) {

    console.error(
        "❌ Market Desk:",
        error
    );


    let message =
        "Não foi possível atualizar os dados";


    if (
        error?.code ===
        "TWELVE_DATA_LIMIT"
    ) {

        message =
            "Limite diário da API atingido";

    } else if (
        error?.status === 429
    ) {

        message =
            "Limite da API atingido";

    } else if (
        error?.status >= 500
    ) {

        message =
            "API de mercado indisponível";

    } else if (
        error?.message
            ?.toLowerCase()
            .includes("failed to fetch")
    ) {

        message =
            "Sem ligação à Internet";
    }


    setMarketStatus(
        false,
        message
    );


    if (chartSource) {

        chartSource.textContent =
            "Fonte: indisponível";
    }
}


/* =========================================================
   SELEÇÃO DE ATIVOS
   ========================================================= */

function setupAssetSelection() {

    document
        .querySelectorAll(".asset-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const symbol =
                        button.dataset.symbol;


                    if (!symbol) {

                        return;
                    }


                    document
                        .querySelectorAll(
                            ".asset-card"
                        )
                        .forEach(card => {

                            card.classList.remove(
                                "active"
                            );
                        });


                    button.classList.add(
                        "active"
                    );


                    selectedSymbol =
                        symbol;


                    chartInitialized =
                        false;


                    await fetchMarketData();
                }
            );
        });
}


/* =========================================================
   TIMEFRAMES
   ========================================================= */

function setupTimeframes() {

    document
        .querySelectorAll(
            ".timeframe"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const interval =
                        button.dataset.interval;


                    if (!interval) {

                        return;
                    }


                    document
                        .querySelectorAll(
                            ".timeframe"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );
                        });


                    button.classList.add(
                        "active"
                    );


                    selectedInterval =
                        interval;


                    chartInitialized =
                        false;


                    await fetchMarketData();
                }
            );
        });
}


/* =========================================================
   REFRESH AUTOMÁTICO
   ========================================================= */

function startAutoRefresh() {

    stopAutoRefresh();


    /*
     * GRÁFICO
     *
     * 1 chamada a cada 60 segundos.
     */

    liveRefreshTimer =
        setInterval(
            refreshLiveMarket,
            MARKET_CONFIG
                .liveRefreshInterval
        );


    /*
     * WATCHLIST
     *
     * 5 chamadas a cada 5 minutos.
     */

    watchlistRefreshTimer =
        setInterval(
            refreshWatchlist,
            MARKET_CONFIG
                .watchlistRefreshInterval
        );
}


/* =========================================================
   PARAR REFRESH
   ========================================================= */

function stopAutoRefresh() {

    if (liveRefreshTimer) {

        clearInterval(
            liveRefreshTimer
        );

        liveRefreshTimer =
            null;
    }


    if (watchlistRefreshTimer) {

        clearInterval(
            watchlistRefreshTimer
        );

        watchlistRefreshTimer =
            null;
    }
}


/* =========================================================
   VISIBILIDADE DA PÁGINA
   ========================================================= */

function setupVisibilityHandling() {

    document.addEventListener(
        "visibilitychange",
        async () => {

            /*
             * Página escondida:
             * parar consumo da API.
             */

            if (document.hidden) {

                stopAutoRefresh();


                console.log(
                    "⏸️ Market Desk pausado."
                );


                return;
            }


            /*
             * Página voltou.
             */

            console.log(
                "▶️ Market Desk retomado."
            );


            await refreshLiveMarket();


            startAutoRefresh();
        }
    );
}


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        console.log(
            "🚀 Market Desk iniciando..."
        );


        createMarketChart();


        setupAssetSelection();


        setupTimeframes();


        setupVisibilityHandling();


        /*
         * Primeira carga:
         *
         * 6 créditos:
         * 5 quote
         * + 1 time_series
         */

        await fetchMarketData();


        /*
         * Só inicia os timers depois
         * da primeira carga.
         */

        startAutoRefresh();


        console.log(
            "✅ Market Desk ativo."
        );


        console.log(
            `📈 Live: ${
                MARKET_CONFIG.liveRefreshInterval /
                1000
            } segundos`
        );


        console.log(
            `📋 Watchlist: ${
                MARKET_CONFIG.watchlistRefreshInterval /
                60000
            } minutos`
        );
    }
);