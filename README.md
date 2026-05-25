# DaemonLogs - Guia Completo Para Leigos

Este guia foi escrito para quem quer colocar o projeto no ar sem precisar adivinhar o que cada arquivo faz.

Se voce nunca configurou um `.env`, nunca subiu um projeto com Docker ou nao sabe a diferenca entre frontend e backend, este tutorial e para voce.

---

## Sumario

1. [O que existe dentro deste projeto](#o-que-existe-dentro-deste-projeto)
2. [O que voce precisa ter antes de comecar](#o-que-voce-precisa-ter-antes-de-comecar)
3. [O que e um arquivo .env](#o-que-e-um-arquivo-env)
4. [Visao geral dos arquivos que voce vai editar](#visao-geral-dos-arquivos-que-voce-vai-editar)
5. [Tutorial principal: subir tudo junto com um unico docker compose](#tutorial-principal-subir-tudo-junto-com-um-unico-docker-compose)
6. [Como preencher o .env do backend passo a passo](#como-preencher-o-env-do-backend-passo-a-passo)
7. [Como preencher o .env do frontend passo a passo](#como-preencher-o-env-do-frontend-passo-a-passo)
8. [Checklist antes de subir tudo](#checklist-antes-de-subir-tudo)
9. [Comando para subir a stack completa](#comando-para-subir-a-stack-completa)
10. [Como saber se deu tudo certo](#como-saber-se-deu-tudo-certo)
11. [Deploy em maquinas separadas](#deploy-em-maquinas-separadas)
12. [Erros comuns e como resolver](#erros-comuns-e-como-resolver)
13. [Curiosidades uteis](#curiosidades-uteis)

---

## O que existe dentro deste projeto

Na raiz voce tem tres coisas principais:

1. `DaemonLogs-backend`
   Responsavel pela API, autenticacao, banco, regras de negocio, emails e pagamentos.

2. `DaemonLogs-frontend`
   Responsavel pela interface visual que o usuario abre no navegador.

3. `docker-compose.yml`
   Responsavel por subir tudo junto em uma stack unica: frontend + backend + postgres.

### Explicando como isso conversa

```text
Seu navegador
   |
   v
Frontend (nginx)
   |
   v
Backend (API)
   |
   v
PostgreSQL
```

### Em palavras simples

- O frontend mostra telas, botoes e formularios.
- O backend recebe as requisicoes e processa tudo.
- O PostgreSQL guarda os dados.
- O `docker-compose.yml` conecta tudo automaticamente.

> **Nota:** no deploy conjunto, o frontend nao fala com o banco diretamente. Quem conversa com o banco e sempre o backend.

---

## O que voce precisa ter antes de comecar

Antes de editar qualquer arquivo, confirme estes itens:

1. Docker Desktop instalado e funcionando.
2. Acesso aos arquivos do projeto na sua maquina.
3. Um editor de texto ou VS Code.
4. Se for usar login por Discord, uma aplicacao criada no Discord Developer Portal.
5. Se for usar emails reais, uma conta SMTP configurada.

### Como saber se o Docker esta funcionando

Abra o terminal na pasta raiz do projeto e rode:

```bash
docker --version
docker compose version
```

Se aparecer versao, esta tudo bem.

Se der erro, instale ou reinicie o Docker Desktop.

> **Nota para leigos:** o Docker precisa estar aberto. Nao basta estar instalado. O aplicativo precisa estar rodando.

---

## O que e um arquivo .env

Um arquivo `.env` e um arquivo de configuracao com pares `NOME=valor`.

Exemplo:

```env
PORT=3000
AUTH_MODE=local
```

Ele serve para dizer ao sistema como deve funcionar sem voce precisar editar o codigo.

### Pense assim

- O codigo e o motor do carro.
- O `.env` e a chave de ignicao e o painel de configuracao.

Sem o `.env`, o projeto ate pode existir, mas nao sabe exatamente como deve se comportar no seu ambiente.

> **Curiosidade:** projetos modernos usam `.env` para manter configuracoes fora do codigo e facilitar deploy em ambientes diferentes.

---

## Visao geral dos arquivos que voce vai editar

Voce vai trabalhar basicamente nestes arquivos:

### Backend

- `DaemonLogs-backend/.env`
- `DaemonLogs-backend/.env.example`

### Frontend

- `DaemonLogs-frontend/.env`
- `DaemonLogs-frontend/.env.example`

### Stack unificada

- `docker-compose.yml`

> **Importante:** `.env.example` e apenas um modelo. O arquivo usado de verdade e o `.env`.

---

## Tutorial principal: subir tudo junto com um unico docker compose

Esta e a forma mais simples para quem quer colocar tudo no ar na mesma maquina.

### O que esse modo faz

- sobe o banco PostgreSQL
- sobe o backend
- sobe o frontend
- conecta os tres automaticamente

### O que voce edita nesse modo

1. `DaemonLogs-backend/.env`
2. `DaemonLogs-frontend/.env`

Depois disso, basta rodar um comando na raiz do projeto.

---

## Como preencher o .env do backend passo a passo

## Passo 1: criar o arquivo .env do backend

Se o arquivo ainda nao existir, copie o exemplo:

```bash
copy DaemonLogs-backend\.env.example DaemonLogs-backend\.env
```

Se voce estiver no PowerShell e o comando `copy` nao funcionar como esperado, tambem pode usar:

```powershell
Copy-Item DaemonLogs-backend\.env.example DaemonLogs-backend\.env
```

---

## Passo 2: entender os blocos do .env do backend

O `.env` do backend tem varios blocos. Voce nao precisa decorar. Basta entender para que cada grupo serve.

### Bloco 1: banco de dados

Exemplo:

```env
DATABASE_URL="postgresql://daemonlogs:changeme@localhost:5432/daemonlogs_db"
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=changeme
POSTGRES_DB=daemonlogs_db
```

### O que cada linha significa

- `POSTGRES_USER`
  Nome do usuario do banco.

- `POSTGRES_PASSWORD`
  Senha do banco.

- `POSTGRES_DB`
  Nome do banco.

- `DATABASE_URL`
  Endereco completo de conexao do backend com o banco.

### Exemplo simples para ambiente local

```env
DATABASE_URL="postgresql://daemonlogs:minha_senha_forte@localhost:5432/daemonlogs_db"
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=minha_senha_forte
POSTGRES_DB=daemonlogs_db
```

### Exemplo mais personalizado

```env
DATABASE_URL="postgresql://meuusuario:Senha123!@localhost:5432/meubanco"
POSTGRES_USER=meuusuario
POSTGRES_PASSWORD=Senha123!
POSTGRES_DB=meubanco
```

> **Nota:** no deploy conjunto com o `docker-compose.yml` da raiz, o Compose troca internamente o host do banco para a rede Docker. Mesmo assim, mantenha esse bloco preenchido corretamente no `.env`, porque ele continua sendo a base das credenciais.

---

### Bloco 2: JWT_SECRET

Exemplo:

```env
JWT_SECRET=changeme_use_a_random_256bit_secret_in_production
```

Essa chave serve para assinar sessoes e tokens.

### Como gerar uma chave boa

Rode este comando:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Exemplo de resultado:

```text
6f4d3f9b34a5733db8a5f4d2d66b8d76a59f5f3e9493d4b1c74a4200a1dcb674
```

Cole isso no `.env`:

```env
JWT_SECRET=6f4d3f9b34a5733db8a5f4d2d66b8d76a59f5f3e9493d4b1c74a4200a1dcb674
```

> **Muito importante:** nunca use `changeme` em producao. Isso e inseguro.

---

### Bloco 3: modo de autenticacao

Exemplo:

```env
AUTH_MODE=local
```

Voce tem duas opcoes:

### Opcao A: login local

Use quando o usuario vai entrar com usuario, email e senha.

```env
AUTH_MODE=local
```

### Opcao B: login com Discord

Use quando o usuario vai entrar pelo botao do Discord.

```env
AUTH_MODE=discord
```

### Como decidir

- Quer login tradicional com cadastro? Use `local`.
- Quer login exclusivamente por Discord? Use `discord`.

> **Nota importante:** se voce colocar `AUTH_MODE=discord`, o frontend tambem precisa usar `VITE_AUTH_MODE=discord`. Eles devem combinar.

---

### Bloco 4: configuracoes do Discord OAuth

Voce so precisa preencher esse bloco se `AUTH_MODE=discord`.

Exemplo do `.env.example`:

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_REDIRECT_URI=http://localhost:3000/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=http://localhost:5173
```

### O que significa cada variavel

- `DISCORD_CLIENT_ID`
  ID da sua aplicacao no portal do Discord.

- `DISCORD_CLIENT_SECRET`
  Chave secreta da aplicacao.

- `DISCORD_REDIRECT_URI`
  URL para onde o Discord devolve o usuario apos o login.

- `DISCORD_OAUTH_FRONTEND_REDIRECT`
  URL final do frontend que vai receber o usuario logado.

### Exemplo para uso local

```env
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=minha_chave_super_secreta_do_discord
DISCORD_REDIRECT_URI=http://localhost/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=http://localhost
```

### Exemplo para uso em dominio real

```env
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=minha_chave_super_secreta_do_discord
DISCORD_REDIRECT_URI=https://app.exemplo.com/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.exemplo.com
```

> **Nota:** no deploy conjunto, o acesso externo entra pelo frontend. Por isso o callback publico precisa apontar para `/api/auth/discord/callback` na URL publica do frontend, e nao para uma porta exposta do backend.

> **Curiosidade:** OAuth e o nome do fluxo em que um sistema terceiriza o login para outro sistema, como Discord, Google ou GitHub.

---

### Bloco 5: configuracoes da aplicacao

Exemplo:

```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
SWAGGER_ENABLED=true
```

### Como preencher no deploy conjunto local

```env
PORT=3000
NODE_ENV=production
APP_URL=http://localhost
SWAGGER_ENABLED=false
```

### Como preencher em dominio real

```env
PORT=3000
NODE_ENV=production
APP_URL=https://app.exemplo.com
SWAGGER_ENABLED=false
```

### Explicacao simples

- `PORT`
  Porta interna da API.

- `NODE_ENV`
  Diz se o ambiente e de desenvolvimento, teste ou producao.

- `APP_URL`
  URL base usada em links e redirecionamentos.

- `SWAGGER_ENABLED`
  Liga ou desliga a documentacao da API.

> **Nota:** para producao, normalmente `SWAGGER_ENABLED=false` e a melhor escolha.

---

### Bloco 6: email SMTP

Esse bloco so e obrigatorio se voce quer enviar email de ativacao, reset de senha e similares.

Exemplo:

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
SMTP_FROM=noreply@seudominio.com
ACTIVATION_CODE_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=15
```

### Cenario 1: quero testar rapido sem email

Use:

```env
EMAIL_ENABLED=false
```

Nesse caso, o sistema ignora a configuracao completa de SMTP.

### Cenario 2: quero email funcionando de verdade

Use algo assim:

```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=meuemail@gmail.com
SMTP_PASS=minha_senha_de_app_do_gmail
SMTP_FROM=meuemail@gmail.com
ACTIVATION_CODE_TTL_MINUTES=60
PASSWORD_RESET_TTL_MINUTES=15
```

> **Nota:** no Gmail, geralmente voce nao usa sua senha comum. Voce usa uma senha de app.

> **Curiosidade:** SMTP e o protocolo usado para envio de email, como se fosse o carteiro da internet para mensagens automaticas.

---

### Bloco 7: dominios de email permitidos e bloqueados

Exemplo:

```env
ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,hotmail.com,yahoo.com
BLOCKED_EMAIL_DOMAINS=10minutemail.com,guerrillamail.com,temp-mail.org,mailinator.com,firemail.com.br,throwam.com,yopmail.com,dispostable.com
```

### O que isso faz

- `ALLOWED_EMAIL_DOMAINS`
  Lista de dominios aceitos.

- `BLOCKED_EMAIL_DOMAINS`
  Lista de dominios temporarios ou suspeitos.

### Exemplo pratico

Se voce quer aceitar apenas Gmail e Outlook:

```env
ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com
```

Se nao quer mexer nisso agora, mantenha como esta no exemplo.

---

### Bloco 8: rate limit, indicacoes e outras configuracoes

Exemplo:

```env
REFERRAL_PREMIUM_THRESHOLD=5
RATE_LIMIT_GLOBAL_MAX=120
RATE_LIMIT_WINDOW_MS=60000
MY_TOKEN_COOLDOWN_HOURS=24
```

### Explicacao

- `REFERRAL_PREMIUM_THRESHOLD`
  Numero de indicacoes para ganhar premium.

- `RATE_LIMIT_GLOBAL_MAX`
  Quantidade maxima de requisicoes por janela.

- `RATE_LIMIT_WINDOW_MS`
  Duracao da janela em milissegundos.

- `MY_TOKEN_COOLDOWN_HOURS`
  Tempo minimo de espera para certas operacoes com token.

Se voce nao sabe o que mudar aqui, mantenha os valores padrao.

---

### Bloco 9: Woovi PIX

Exemplo:

```env
WOOVI_API_KEY=your_woovi_app_id
WOOVI_WEBHOOK_SECRET=your_webhook_secret
WOOVI_CHARGE_VALUE_CENTS=3990
```

### Quando preencher

Preencha apenas se for usar pagamentos PIX com Woovi.

### Exemplo realista

```env
WOOVI_API_KEY=app_xpto_123456
WOOVI_WEBHOOK_SECRET=segredo_do_webhook_abc123
WOOVI_CHARGE_VALUE_CENTS=3990
```

### O que significa 3990

`3990` centavos = `R$ 39,90`

> **Curiosidade:** muitos sistemas trabalham com valor em centavos para evitar erros matematicos com dinheiro.

---

## Exemplo completo de backend em modo local

Use isso como exemplo base se voce quer o caminho mais simples:

```env
DATABASE_URL="postgresql://daemonlogs:minha_senha_forte@localhost:5432/daemonlogs_db"
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=minha_senha_forte
POSTGRES_DB=daemonlogs_db

JWT_SECRET=6f4d3f9b34a5733db8a5f4d2d66b8d76a59f5f3e9493d4b1c74a4200a1dcb674

AUTH_MODE=local

PORT=3000
NODE_ENV=production
APP_URL=http://localhost
SWAGGER_ENABLED=false

EMAIL_ENABLED=false

ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,hotmail.com,yahoo.com
BLOCKED_EMAIL_DOMAINS=10minutemail.com,guerrillamail.com,temp-mail.org,mailinator.com,firemail.com.br,throwam.com,yopmail.com,dispostable.com

REFERRAL_PREMIUM_THRESHOLD=5
RATE_LIMIT_GLOBAL_MAX=120
RATE_LIMIT_WINDOW_MS=60000
MY_TOKEN_COOLDOWN_HOURS=24

WOOVI_API_KEY=your_woovi_app_id
WOOVI_WEBHOOK_SECRET=your_webhook_secret
WOOVI_CHARGE_VALUE_CENTS=3990
```

---

## Exemplo completo de backend em modo Discord

Use isso como base se quiser login apenas via Discord:

```env
DATABASE_URL="postgresql://daemonlogs:minha_senha_forte@localhost:5432/daemonlogs_db"
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=minha_senha_forte
POSTGRES_DB=daemonlogs_db

JWT_SECRET=6f4d3f9b34a5733db8a5f4d2d66b8d76a59f5f3e9493d4b1c74a4200a1dcb674

AUTH_MODE=discord

DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=segredo_do_discord
DISCORD_REDIRECT_URI=http://localhost/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=http://localhost

PORT=3000
NODE_ENV=production
APP_URL=http://localhost
SWAGGER_ENABLED=false

EMAIL_ENABLED=false

ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,hotmail.com,yahoo.com
BLOCKED_EMAIL_DOMAINS=10minutemail.com,guerrillamail.com,temp-mail.org,mailinator.com,firemail.com.br,throwam.com,yopmail.com,dispostable.com

REFERRAL_PREMIUM_THRESHOLD=5
RATE_LIMIT_GLOBAL_MAX=120
RATE_LIMIT_WINDOW_MS=60000
MY_TOKEN_COOLDOWN_HOURS=24

WOOVI_API_KEY=your_woovi_app_id
WOOVI_WEBHOOK_SECRET=your_webhook_secret
WOOVI_CHARGE_VALUE_CENTS=3990
```

---

## Como preencher o .env do frontend passo a passo

## Passo 1: criar o arquivo .env do frontend

Se ainda nao existir:

```bash
copy DaemonLogs-frontend\.env.example DaemonLogs-frontend\.env
```

Ou no PowerShell:

```powershell
Copy-Item DaemonLogs-frontend\.env.example DaemonLogs-frontend\.env
```

---

## Passo 2: entender o que existe no frontend

O `.env` do frontend e pequeno, mas muito importante.

Exemplo:

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_MODE=local
```

### O que cada linha faz

- `VITE_API_URL`
  Diz ao frontend onde esta a API.

- `VITE_AUTH_MODE`
  Diz ao frontend qual interface de login mostrar.

> **Muito importante:** variaveis do frontend comecam com `VITE_` porque o Vite expoe essas variaveis para o navegador.

---

## Passo 3: como preencher o frontend no deploy conjunto

Se voce vai usar o `docker-compose.yml` da raiz, use este exemplo:

### Se o backend esta em modo local

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_MODE=local
```

### Se o backend esta em modo Discord

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_MODE=discord
```

### O que acontece no deploy conjunto

Mesmo que `VITE_API_URL` esteja assim no `.env`, o compose da raiz injeta `/api` no build do frontend para o deploy unificado.

Em outras palavras:

- externamente o usuario acessa o frontend
- internamente o nginx do frontend encaminha `/api` para o backend

> **Nota para nao confundir:** o `.env` do frontend continua existindo porque ele tambem precisa funcionar fora da stack unificada, em deploy separado.

---

## Passo 4: regra mais importante do frontend

`VITE_AUTH_MODE` precisa combinar com `AUTH_MODE` do backend.

### Combinacoes corretas

```env
# backend
AUTH_MODE=local

# frontend
VITE_AUTH_MODE=local
```

```env
# backend
AUTH_MODE=discord

# frontend
VITE_AUTH_MODE=discord
```

### Combinacoes erradas

```env
# backend
AUTH_MODE=discord

# frontend
VITE_AUTH_MODE=local
```

Isso deixa a interface e o backend falando linguas diferentes.

Exemplo do problema:

- frontend mostra formulario de cadastro
- backend rejeita cadastro porque esta em modo Discord

---

## Exemplo completo de frontend em modo local

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_MODE=local
```

## Exemplo completo de frontend em modo Discord

```env
VITE_API_URL=http://localhost:3000
VITE_AUTH_MODE=discord
```

---

## Checklist antes de subir tudo

Antes de rodar o Docker, revise esta lista:

1. O arquivo `DaemonLogs-backend/.env` existe.
2. O arquivo `DaemonLogs-frontend/.env` existe.
3. `JWT_SECRET` foi trocado por uma chave real.
4. `POSTGRES_PASSWORD` nao ficou como `changeme`.
5. `AUTH_MODE` do backend esta definido.
6. `VITE_AUTH_MODE` do frontend esta igual ao backend.
7. Se `AUTH_MODE=discord`, as chaves do Discord foram preenchidas.
8. Se `EMAIL_ENABLED=true`, os dados SMTP foram preenchidos.
9. O Docker Desktop esta aberto.

---

## Comando para subir a stack completa

Na raiz do projeto, rode:

```bash
docker compose up --build -d
```

### O que esse comando faz

- `docker compose up`
  sobe os servicos

- `--build`
  reconstrói as imagens antes de subir

- `-d`
  roda em background, sem prender o terminal

> **Erro comum:** `docker compose up -build` esta errado. O certo e `--build` com dois hifens.

---

## Como saber se deu tudo certo

Rode:

```bash
docker compose ps
```

Voce deve ver algo parecido com isto:

```text
daemonlogs-api        Up (healthy)
daemonlogs-frontend   Up
daemonlogs-postgres   Up (healthy)
```

Depois acesse:

```text
http://localhost
```

Se abrir a tela inicial, o frontend subiu.

Se o login funcionar, a comunicacao com o backend esta funcionando.

---

## Deploy em maquinas separadas

Agora vem a parte importante: como fazer quando frontend e backend vao morar em lugares diferentes.

Isso pode acontecer, por exemplo, quando:

- o backend fica em um VPS
- o frontend fica em outro servidor
- voce usa provedores diferentes para cada parte

### Regra principal

Cada projeto precisa ter o seu proprio `.env` preenchido corretamente.

O frontend nao deve depender de ler nada da pasta do backend.

---

## Cenario A: backend e banco em uma maquina, frontend em outra

### Servidor 1: backend

Edite `DaemonLogs-backend/.env`.

Exemplo:

```env
DATABASE_URL="postgresql://daemonlogs:minha_senha_forte@localhost:5432/daemonlogs_db"
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=minha_senha_forte
POSTGRES_DB=daemonlogs_db

JWT_SECRET=6f4d3f9b34a5733db8a5f4d2d66b8d76a59f5f3e9493d4b1c74a4200a1dcb674

AUTH_MODE=discord

DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=segredo_do_discord
DISCORD_REDIRECT_URI=https://app.exemplo.com/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.exemplo.com

PORT=3000
NODE_ENV=production
APP_URL=https://app.exemplo.com
SWAGGER_ENABLED=false

EMAIL_ENABLED=false
```

Suba o backend com o compose do proprio backend.

---

### Servidor 2: frontend

Edite `DaemonLogs-frontend/.env`.

Exemplo:

```env
VITE_API_URL=https://api.exemplo.com
VITE_AUTH_MODE=discord
```

### O que significa esse exemplo

- o frontend esta em uma maquina
- o backend esta publicado em `https://api.exemplo.com`
- o frontend vai mandar requisicoes para essa URL publica

> **Nota:** em deploy separado, `VITE_API_URL` precisa apontar para a URL publica real do backend. Nao use `localhost` nesse caso.

---

## Exemplo de combinacao correta em producao separada

### Backend

```env
AUTH_MODE=discord
DISCORD_REDIRECT_URI=https://app.exemplo.com/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.exemplo.com
APP_URL=https://app.exemplo.com
```

### Frontend

```env
VITE_API_URL=https://api.exemplo.com
VITE_AUTH_MODE=discord
```

---

## Erros comuns e como resolver

## Erro 1: o login mostrado na tela nao combina com o backend

### Causa provavel

`AUTH_MODE` e `VITE_AUTH_MODE` estao diferentes.

### Como corrigir

Alinhe os dois arquivos:

```env
# backend
AUTH_MODE=discord

# frontend
VITE_AUTH_MODE=discord
```

Depois reconstrua o frontend:

```bash
docker compose up --build -d
```

---

## Erro 2: mudei o .env do frontend e nada aconteceu

### Causa provavel

O frontend usa Vite, e variaveis `VITE_*` entram no build da aplicacao.

### Como corrigir

Rebuild a imagem:

```bash
docker compose up --build -d
```

---

## Erro 3: `docker compose up -build` nao funciona

### Motivo

O comando esta escrito errado.

### Correto

```bash
docker compose up --build -d
```

---

## Erro 4: backend sobe, mas login Discord nao funciona

### Verifique estes pontos

1. `AUTH_MODE=discord`
2. `VITE_AUTH_MODE=discord`
3. `DISCORD_CLIENT_ID` preenchido
4. `DISCORD_CLIENT_SECRET` preenchido
5. `DISCORD_REDIRECT_URI` cadastrado no portal do Discord
6. `DISCORD_OAUTH_FRONTEND_REDIRECT` apontando para a URL correta do frontend

---

## Erro 5: emails nao chegam

### Verifique

1. `EMAIL_ENABLED=true`
2. `SMTP_HOST` correto
3. `SMTP_PORT` correto
4. `SMTP_USER` correto
5. `SMTP_PASS` correto
6. `SMTP_FROM` valido

Se quiser testar sem email, use:

```env
EMAIL_ENABLED=false
```

---

## Curiosidades uteis

### 1. Por que o frontend usa `VITE_` nas variaveis?

Porque esse projeto usa Vite. Somente variaveis com prefixo `VITE_` ficam acessiveis no navegador.

### 2. Por que existem `.env` separados?

Porque frontend e backend podem ser publicados em lugares diferentes no futuro. Cada um precisa saber funcionar de forma independente.

### 3. Por que o banco nao fica exposto no navegador?

Por seguranca. O usuario nunca deve acessar o banco diretamente.

### 4. Por que alguns valores estao em centavos?

Para evitar erros matematicos com dinheiro.

### 5. Por que o frontend precisa de rebuild quando muda `.env`?

Porque as variaveis do Vite entram no build estatico da aplicacao. Mudar o arquivo sem rebuild nao atualiza o que foi empacotado.

---

## Resumo rapido para quem quer a resposta curta

### Backend

Preencha:

- banco
- `JWT_SECRET`
- `AUTH_MODE`
- Discord, se usar modo Discord
- SMTP, se usar email

### Frontend

Preencha:

- `VITE_API_URL`
- `VITE_AUTH_MODE`

### Regra de ouro

`AUTH_MODE` e `VITE_AUTH_MODE` devem ser iguais.

### Subir tudo junto

```bash
docker compose up --build -d
```

---

## Fechamento

Se voce seguir este tutorial com calma, linha por linha, o projeto sobe sem precisar mexer no codigo.

Se algo falhar, o primeiro lugar para revisar e sempre:

1. `DaemonLogs-backend/.env`
2. `DaemonLogs-frontend/.env`
3. o comando usado no terminal
4. se houve rebuild depois de mudar algo do frontend

Fim.
