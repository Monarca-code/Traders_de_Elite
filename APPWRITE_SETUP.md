# TRADERS DE ELITE — Configuração Appwrite

## 1. Projeto

O projeto já está configurado para:

- Project ID: `6ab3b545002b36b75001`
- Endpoint: `https://fra.cloud.appwrite.io/v1`
- Frontend: HTML + CSS + JavaScript (No framework)

Não coloque uma API key/server key no frontend.

---

# 2. Authentication

No Appwrite:

**Auth → Settings → Email/Password**

Ative o login por e-mail e senha.

A aplicação usa:

- Cadastro: `account.create(...)`
- Login: `account.createEmailPasswordSession(...)`
- Sessão: `account.get()`
- Logout: `account.deleteSession("current")`

---

# 3. Database

Crie um Database com o ID:

`traders_elite`

Nome:

`TRADERS DE ELITE`

Depois crie as collections abaixo com os IDs exatamente iguais.

## Collection: profiles

Atributos:

| Atributo | Tipo | Obrigatório |
|---|---|---|
| nome_completo | string | sim |
| email | email/string | sim |
| telefone | string | não |
| tipo | string | sim |
| estado | string | sim |
| data_registro | datetime/string | sim |

Document ID: o mesmo `$id` do utilizador.

Permissions recomendadas para começar:
- Read: Users
- Create: Users
- Update: Users

Para produção, podemos restringir ainda mais as permissions por utilizador.

---

## Collection: courses

Atributos:

| Atributo | Tipo | Obrigatório |
|---|---|---|
| titulo | string | sim |
| descricao | string | não |
| publicado | boolean | sim |
| ordem | integer | não |

---

## Collection: modules

Atributos:

| Atributo | Tipo | Obrigatório |
|---|---|---|
| course_id | string | sim |
| titulo | string | sim |
| ordem | integer | sim |

---

## Collection: lessons

Atributos usados pela versão atual do projeto:

| Atributo | Tipo | Obrigatório |
|---|---|---|
| modulo_id | string | sim |
| titulo | string | sim |
| descricao | string | não |
| conteudo | string | não |
| video_url | string | não |
| ordem | integer | sim |
| publicado | boolean | sim |

### Vídeos das aulas

A área administrativa recebe o **link do vídeo publicado no YouTube**.

Exemplos aceitos:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`

O administrador não envia o ficheiro de vídeo para o Appwrite. O link é guardado em `video_url` e o portal apresenta o vídeo através de um `iframe` do YouTube.

---

## Collection: enrollments

Atributos:

| Atributo | Tipo | Obrigatório |
|---|---|---|
| student_id | string | sim |
| course_id | string | sim |
| estado | string | não |
| data_inscricao | datetime/string | não |

Crie um índice para:
- `student_id`

Opcionalmente um índice composto para:
- `student_id`
- `course_id`

---

## Collection: progress

Atributos usados pela versão atual do projeto:

| Atributo | Tipo | Obrigatório |
|---|---|---|
| student_id | string | sim |
| course_id | string | sim |
| lesson_id | string | sim |
| completed | boolean | sim |
| progress | integer | sim |

Crie índices para:

- `student_id`
- `lesson_id`

Opcionalmente, um índice composto para:

- `student_id`
- `course_id`
- `lesson_id`

Crie um índice para:
- `student_id`

E outro para:
- `lesson_id`

Opcionalmente um índice composto para:
- `student_id`
- `lesson_id`

---

# 4. Collections futuras

Podem ser criadas depois:

## materials

- titulo
- descricao
- arquivo_id
- lesson_id
- publicado

## events

- titulo
- descricao
- data_evento
- imagem_url
- publicado

## insights

- titulo
- resumo
- conteudo
- imagem_url
- publicado
- criado_em

## inscriptions

- nome
- email
- telefone
- motivo
- estado
- criado_em

---

# 5. Ordem de criação

Faça nesta ordem:

1. Database `traders_elite`
2. `profiles`
3. `courses`
4. `modules`
5. `lessons`
6. `enrollments`
7. `progress`
8. `certificate_requests`

Depois podemos criar:

8. `materials`
9. `events`
10. `insights`
11. `inscriptions`

---

# 6. Primeiro teste

Depois de criar `profiles`:

1. Abra `portal/cadastro.html`.
2. Crie um utilizador.
3. Confirme em **Auth → Users** que o utilizador apareceu.
4. Confirme em **Databases → profiles** que o perfil apareceu.
5. Abra `portal/login.html`.
6. Faça login.
7. Deve entrar em `dashboard.html`.

---

# 7. Curso de teste

Crie em `courses`:

- titulo: `Introdução ao Trading`
- descricao: `Fundamentos para compreender os mercados financeiros.`
- publicado: `true`
- ordem: `1`

Depois crie um módulo em `modules` usando o `$id` do curso:

- titulo: `Módulo 1 — Fundamentos`
- course_id: `$id do curso`
- ordem: `1`

Depois crie uma aula em `lessons` usando o `$id` do módulo:

- titulo: `Aula 1 — O que é Trading?`
- modulo_id: `$id do módulo`
- descricao: `Introdução aos conceitos fundamentais.`
- conteudo: `Nesta aula estudamos os conceitos básicos do trading.`
- youtube_video_id: `SEU_ID_DO_YOUTUBE`
- ordem: `1`
- publicado: `true`

Finalmente crie uma matrícula em `enrollments`:

- student_id: `$id do utilizador`
- course_id: `$id do curso`
- estado: `ativo`

Depois o curso aparecerá no dashboard.

---

# 8. Estrutura final

```text
TRADERS DE ELITE
│
├── index.html
│
├── css/
│   ├── style.css
│   ├── responsive.css
│   └── animations.css
│
├── js/
│   ├── appwrite-config.js
│   ├── main.js
│   └── index.js
│
└── portal/
    ├── login.html
    ├── cadastro.html
    ├── dashboard.html
    ├── course.html
    ├── aula.html
    │
    ├── css/
    │   └── portal.css
    │
    └── js/
        ├── login.js
        ├── cadastro.js
        ├── dashboard.js
        ├── course.js
        └── aula.js
        
        
```

O frontend não usa Supabase nesta versão.
