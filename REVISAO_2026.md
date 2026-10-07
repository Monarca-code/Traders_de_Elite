# TRADERS DE ELITE — REVISÃO DO PROJETO

## Correções realizadas

- Corrigidos os caminhos entre `index.html`, `pages/` e `portal/`.
- Corrigidos scripts e CSS das páginas públicas.
- Criadas as páginas que estavam vazias:
  - `pages/comunidade.html`
  - `pages/parceiros.html`
  - `pages/inscricao.html`
  - `pages/transparencia.html`
  - `pages/mercado.html`
- Corrigida a responsividade pública em `css/responsive.css`.
- Adicionada a classe `.container` global e regras de segurança de layout.
- Corrigido o campo das aulas de `module_id` para `modulo_id` em dashboard, curso, aula e administração.
- Corrigida a documentação do Appwrite para refletir `modulo_id`.
- Corrigida a configuração de `certificate_requests`.
- Dashboard do estudante atualizado com:
  - sino de notificações;
  - contador de notificações não lidas;
  - painel de notificações;
  - marcar notificações como lidas;
  - toast de novas atualizações;
  - atualização via Appwrite Realtime quando disponível;
  - notificações derivadas de cursos disponíveis, conclusão de formação e pedidos de certificado.
- Melhorada a responsividade do painel de notificações em telemóveis.
- Mantidos os documentos existentes.

## Verificações

- HTMLs encontrados: 15
- HTMLs vazios: 0
- Links locais quebrados: 0
- Âncoras locais quebradas: 0
- Referências `module_id` em HTML/JS: 0
- JavaScript validado com `node --check`: OK

## Observação sobre notificações

As notificações do estudante são baseadas nos dados que o portal já possui, especialmente cursos, progresso e `certificate_requests`. O Appwrite Realtime permite atualização imediata enquanto o dashboard estiver aberto; ao voltar ao dashboard, os dados são recalculados novamente.

