# Administração — TRADERS DE ELITE

## Administrador autorizado

E-mail:
`tradersdeelite2026@gmail.com`

Senha definida para a conta administrativa:
`tradersdeelite26`

> A senha não foi gravada no JavaScript do site. Ela deve existir na conta de autenticação do Appwrite.

## Como configurar no Appwrite

1. Abra o projeto `Traders de Elite`.
2. Vá para **Auth / Users**.
3. Localize `tradersdeelite2026@gmail.com`.
4. Se a conta ainda não existir, crie-a.
5. Defina a senha como `tradersdeelite26`.
6. Entre no portal normalmente em `/portal/login.html`.
7. Depois de autenticar, abra `/portal/admin/`.

## Proteção

`portal/admin/admin.js` verifica a sessão e permite a área administrativa somente quando o e-mail autenticado é:

`tradersdeelite2026@gmail.com`

Qualquer outro utilizador autenticado é desconectado e enviado de volta para o login.

A proteção de interface não substitui as permissões do Appwrite. Antes de colocar o site em produção, configure as permissões das coleções e do Storage para que somente o administrador possa criar, alterar ou apagar conteúdo administrativo.
