# SUPORTE IA

Foi adicionada a página `pages/suporte.html` e o endpoint `api/support.js`.

## Para ativar a IA na Vercel

1. Crie uma chave da Gemini API.
2. No projeto da Vercel, abra Settings > Environment Variables.
3. Adicione:
   - `GEMINI_API_KEY` = sua chave
   - opcional: `GEMINI_MODEL` = `gemini-2.5-flash`
4. Faça novo deploy.

A chave fica apenas no backend (`api/support.js`) e não é colocada no JavaScript público.

Sem a variável `GEMINI_API_KEY`, a interface abre normalmente, mas o chat não consegue gerar respostas.
