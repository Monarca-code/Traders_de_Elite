# TRADERS DE ELITE — Market Desk / API

## 1. Twelve Data

1. Criar uma conta em Twelve Data.
2. Copiar a API Key.
3. Não colocar a chave em nenhum HTML/JS público.

O plano Basic atual é gratuito e fornece 8 créditos de API por minuto e 800 por dia. A página de preços informa acesso em tempo real para Forex e cripto; WebSocket completo começa no Pro. Verifique a cobertura/licença do ativo antes de publicar dados para terceiros.

## 2. Criar a Appwrite Function

No projeto Appwrite `Traders de Elite`:

- Functions → Create function
- Name: `Market Data`
- ID: `market-data`
- Runtime: `Node.js 22`
- Entrypoint: `index.js`
- Build command: `npm install`
- Execute access: `Any` (a página pública precisa consultar o endpoint)

Código desta função:

`functions/market-data/index.js`

## 3. Variável secreta

Em:

Functions → market-data → Settings → Environment variables

Criar:

- Key: `TWELVE_DATA_API_KEY`
- Value: sua API Key da Twelve Data
- Secret: ativado

Depois de alterar a variável, faça novo deployment. O Appwrite informa que mudanças de variáveis só entram em vigor após novo deployment.

## 4. Deployment

Pode usar o Appwrite Console com deployment manual ou Git.

Se usar CLI:

```bash
appwrite push functions
```

## 5. Frontend

O `pages/mercado.html` já inclui:

- Appwrite SDK
- `js/appwrite-config.js`
- Lightweight Charts
- `pages/js/mercado.js`

O frontend chama a Function pelo ID:

`market-data`

A API Key nunca chega ao navegador.

## 6. Consumo atual

Cada atualização consulta:

- EUR/USD quote
- GBP/USD quote
- USD/JPY quote
- XAU/USD quote
- BTC/USD quote
- 1 série histórica do ativo selecionado

São até 6 créditos por atualização.

O frontend atualiza a cada 2 minutos, em vez de a cada 60 segundos, para reduzir consumo do plano gratuito.

## 7. Importante sobre “tempo real”

Esta primeira fase usa REST/polling. Ela atualiza periodicamente, mas não é tick-by-tick.

Para streaming contínuo via WebSocket, a documentação atual da Twelve Data indica acesso completo a partir do plano Pro. Essa será uma fase posterior, se fizer sentido para o projeto.
