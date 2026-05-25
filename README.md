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
11. [Configurando o Nginx na VPS (HTTPS e dominio)](#configurando-o-nginx-na-vps-https-e-dominio)
12. [Configurando o Woovi PIX (webhook)](#configurando-o-woovi-pix-webhook)
13. [Deploy em maquinas separadas](#deploy-em-maquinas-separadas)
14. [Erros comuns e como resolver](#erros-comuns-e-como-resolver)
15. [Curiosidades uteis](#curiosidades-uteis)

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

### Deploy unificado (tudo em uma VPS)

- `.env` na raiz — **unico arquivo a configurar**
- `.env.example` na raiz — modelo base
- `docker-compose.yml` — sobe backend + frontend + banco

### Deploy separado (VPSs diferentes)

- `DaemonLogs-backend/.env` — configura so o backend + banco
- `DaemonLogs-backend/.env.example` — modelo
- `DaemonLogs-frontend/.env` — configura so o frontend
- `DaemonLogs-frontend/.env.example` — modelo

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

Apenas **um arquivo na raiz do projeto**: `.env`

Todas as configuracoes — banco, backend, frontend e compose — ficam nesse unico arquivo.

Depois disso, basta rodar um comando na raiz do projeto.

---

## Como preencher o .env do backend passo a passo

> **Lendo este guia para o deploy unificado?**
> Nesse caso voce vai criar `.env` **na raiz do projeto** (nao dentro de `DaemonLogs-backend`).
> O `.env.example` da raiz ja contem todos os campos necessarios.
> Os passos e explicacoes abaixo valem igualmente — os blocos e variaveis sao os mesmos.

## Passo 1: criar o arquivo .env

### Para deploy unificado (raiz do projeto)

```bash
copy .env.example .env
```

Ou no PowerShell:

```powershell
Copy-Item .env.example .env
```

### Para deploy so do backend (VPS separada)

```bash
copy DaemonLogs-backend\.env.example DaemonLogs-backend\.env
```

Ou no PowerShell:

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

> **Nota sobre `DATABASE_URL` no deploy unificado:** voce nao precisa definir `DATABASE_URL` no `.env` da raiz. O compose a constroi automaticamente em runtime a partir de `POSTGRES_USER`, `POSTGRES_PASSWORD` e `POSTGRES_DB`, com URL-encoding correto da senha (inclusive senhas com caracteres especiais como `@`, `#`, `!`). Basta preencher as tres variaveis `POSTGRES_*`.
>
> **Nota sobre deploy separado (backend standalone):** nesse caso, mantenha `DATABASE_URL` no `DaemonLogs-backend/.env` com o host correto (`localhost` para acesso local ou `postgres` na rede Docker interna).
>
> **Nota sobre a porta:** `PORT` deve ser `3000`. O nginx interno do compose faz proxy para `api:3000`. Usar outra porta (ex: `5000`) quebra o proxy e o healthcheck.

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

> **Deploy unificado?** As variaveis do frontend (`VITE_AUTH_MODE`) estao no `.env` da raiz.
> Esta secao descreve o funcionamento das variaveis e o que preencher no deploy separado.

## Passo 1: criar o arquivo .env do frontend (deploy separado)

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

No deploy unificado voce **nao edita `DaemonLogs-frontend/.env`**.

Voce edita o `.env` da **raiz do projeto** e define apenas:

```env
VITE_AUTH_MODE=local   # ou discord
```

O `VITE_API_URL` nao precisa ser configurado no `.env` da raiz — o compose injeta `/api` automaticamente no build para que o nginx interno faca o proxy.

### Para deploy separado do frontend

```env
# DaemonLogs-frontend/.env
VITE_API_URL=https://api.seudominio.com   # URL publica do backend
VITE_AUTH_MODE=local                      # ou discord
```

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

### Para deploy unificado (raiz)

1. O arquivo `.env` na raiz existe (copiado de `.env.example`).
2. `JWT_SECRET` foi trocado por uma chave real.
3. `POSTGRES_PASSWORD` nao ficou como `changeme`.
4. `AUTH_MODE` e `VITE_AUTH_MODE` estao definidos com o mesmo valor.
5. `PORT` esta como `3000` (nao mude para outra porta no deploy unificado).
6. Se `AUTH_MODE=discord`, as chaves do Discord foram preenchidas.
7. Se `EMAIL_ENABLED=true`, os dados SMTP foram preenchidos.
8. O Docker Desktop esta aberto.

### Para deploy separado (VPSs diferentes)

1. `DaemonLogs-backend/.env` existe e esta preenchido.
2. `DaemonLogs-frontend/.env` existe e esta preenchido.
3. `JWT_SECRET` foi trocado por uma chave real.
4. `POSTGRES_PASSWORD` nao ficou como `changeme`.
5. `AUTH_MODE` (backend) igual a `VITE_AUTH_MODE` (frontend).
6. Se `AUTH_MODE=discord`, as chaves do Discord foram preenchidas.
7. O Docker esta aberto em cada servidor.

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

### O que fazer se algo der errado? (Como ver os logs)

Se um container nao subir ou estiver com status "unhealthy", o primeiro passo e olhar os logs.

Na raiz do projeto, rode:

```bash
# Ver os logs da API (backend)
docker compose logs api

# Ver os logs do frontend
docker compose logs frontend

# Ver os logs do banco de dados
docker compose logs postgres
```

Para ver os logs em tempo real (eles vao aparecendo na tela conforme acontecem), adicione `-f`:

```bash
# Ver logs da API em tempo real
docker compose logs -f api
```

Os logs geralmente mostram a mensagem de erro exata, como "senha do banco invalida" ou "variavel de ambiente faltando".

---

## Configurando o Nginx na VPS (HTTPS e dominio)

### O que e nginx

Nginx (pronuncia-se "engine-x") e um servidor web que funciona como intermediario entre os usuarios na internet e o seu sistema.

Pense assim:

- Seu dominio (`duciferzinho.com`) e o endereco da sua loja.
- O nginx e o porteiro que recebe quem chega na porta e encaminha para dentro.
- O Docker e o interior da loja, onde tudo funciona.

---

### Por que existem dois nginx neste projeto?

Este projeto tem dois nginx em camadas diferentes:

#### Nginx interno (dentro do Docker)

- Ja vem **pronto e configurado** no arquivo `nginx.conf` da raiz do projeto.
- Voce **nao precisa tocar nele**.
- Ele e responsavel por:
  - Servir os arquivos do frontend React
  - Encaminhar requisicoes de `/api/*` para o backend (comunicacao interna Docker)

#### Nginx externo (instalado na VPS, fora do Docker)

- Voce precisa instalar e configurar este.
- Ele e responsavel por:
  - Receber requisicoes da internet nas portas 80 (HTTP) e 443 (HTTPS)
  - Encaminhar para o Docker na porta definida em `FRONTEND_PORT`
  - Gerenciar o certificado SSL (cadeado verde no navegador)

---

### Como fica o fluxo completo

```text
Usuario no navegador
        |
        | HTTPS porta 443
        v
Nginx externo (instalado na VPS)       <- voce configura este
        |
        | proxy para 127.0.0.1:FRONTEND_PORT (ex: 5000)
        v
Docker compose (container do frontend) <- ja vem pronto no projeto
        |
        +-- /     React SPA (arquivos estaticos)
        |
        +-- /api/* Backend Fastify   <- comunicacao interna Docker
                    |
                    v
                 PostgreSQL           <- comunicacao interna Docker
```

> O Docker interno nao precisa nem pode ser acessado diretamente pela internet. O nginx externo e quem "abre a porta".

---

### Passo 1: instalar o nginx na VPS

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

Verifique se instalou:

```bash
nginx -v
```

---

### Passo 2: criar o arquivo de configuracao do nginx externo

Crie um arquivo de configuracao para o seu dominio:

```bash
sudo nano /etc/nginx/sites-available/daemonlogs
```

Cole o conteudo abaixo. Substitua:
- `duciferzinho.com` pelo seu dominio
- `5000` pelo valor de `FRONTEND_PORT` do seu `.env`

```nginx
server {
    listen 80;
    server_name duciferzinho.com;

    # Necessario para o certbot gerar/renovar o certificado SSL
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redireciona HTTP para HTTPS automaticamente
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name duciferzinho.com;

    # Certificados gerados pelo certbot (passo 3)
    ssl_certificate     /etc/letsencrypt/live/duciferzinho.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/duciferzinho.com/privkey.pem;

    # Encaminha TUDO para o Docker na porta FRONTEND_PORT
    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Ative a configuracao:

```bash
sudo ln -s /etc/nginx/sites-available/daemonlogs /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Passo 3: gerar o certificado SSL (HTTPS gratuito)

```bash
sudo certbot --nginx -d duciferzinho.com
```

O certbot vai:
1. Pedir seu email
2. Pedir para aceitar os termos
3. Gerar e instalar o certificado automaticamente
4. Recarregar o nginx

Apos isso, `https://duciferzinho.com` funcionara com o cadeado verde.

Verifique se a renovacao automatica esta ativa:

```bash
sudo certbot renew --dry-run
```

---

### Relacao entre FRONTEND_PORT e o nginx externo

O `FRONTEND_PORT` no `.env` define em qual porta do host o Docker vai expor o frontend.

Exemplo:

```env
FRONTEND_PORT=5000
```

Isso significa:
- Docker expoe a porta `5000` do servidor
- O nginx externo encaminha para `http://127.0.0.1:5000`
- O usuario acessa normalmente por `https://seudominio.com` (porta 443)

> Se voce mudar `FRONTEND_PORT`, atualize tambem o `proxy_pass` no arquivo de configuracao do nginx externo.

---

## Configurando o Woovi PIX (webhook)

### O que e um webhook

Webhook e uma notificacao automatica. Quando um usuario paga o PIX, o Woovi envia uma requisicao para o seu backend avisando. O backend entao ativa o premium do usuario automaticamente.

Sem o webhook configurado, o pagamento e processado no Woovi, mas o sistema nunca fica sabendo.

---

### As tres variaveis do Woovi

```env
WOOVI_API_KEY=           # chave de autorizacao para criar cobrancas PIX
WOOVI_WEBHOOK_SECRET=    # segredo para verificar se o webhook e legitimo
WOOVI_CHARGE_VALUE_CENTS=2000  # valor da assinatura em centavos
```

---

### Onde encontrar o WOOVI_API_KEY

1. Acesse [https://app.woovi.com](https://app.woovi.com)
2. No menu lateral, clique em **API/Plugins**
3. Abra a sua aplicacao
4. Copie o valor do campo **Authorization**
   (e um texto longo em base64, começa com `Q2xp...`)

Esse valor vai para `WOOVI_API_KEY`.

---

### Onde encontrar o WOOVI_WEBHOOK_SECRET

1. Ainda em **API/Plugins** → sua aplicacao
2. Copie o valor do campo **AppID**
   (e um texto mais curto, diferente do Authorization)

Esse valor vai para `WOOVI_WEBHOOK_SECRET`.

> **Por que o AppID e o segredo?** O Woovi assina cada requisicao de webhook usando o AppID como chave. O backend usa esse mesmo AppID para verificar que a requisicao veio de verdade do Woovi e nao de outra fonte.

---

### Como configurar o webhook no painel Woovi

1. No menu do Woovi, va em **API/Plugins** → **Webhooks**
2. Clique em **Criar webhook** (ou edite o existente)
3. Preencha exatamente assim:

| Campo | Valor |
|---|---|
| Nome | daemonlogs |
| Evento | `OPENPIX:CHARGE_COMPLETED` |
| URL | `https://seudominio.com/api/webhooks/woovi` |

> **Atencao critica:** a URL nao e apenas o dominio raiz. Ela deve terminar em `/api/webhooks/woovi`. Exemplo correto: `https://duciferzinho.com/api/webhooks/woovi`

4. Nao precisa adicionar cabecalhos HTTP manuais — o Woovi gera a assinatura automaticamente
5. Salve o webhook

O Woovi vai tentar acessar a URL para verificar se ela responde com HTTP 200. O Docker compose precisa estar rodando antes de salvar o webhook.

---

### Ordem correta para configurar

1. Preencha `WOOVI_API_KEY` e `WOOVI_WEBHOOK_SECRET` no `.env`
2. Suba o Docker compose (`docker compose up --build -d`)
3. Configure o nginx externo (para HTTPS funcionar)
4. Abra o painel Woovi e salve o webhook com a URL correta

Se o webhook nao conseguir ser salvo, significa que o endpoint ainda nao esta acessivel. Verifique se o Docker e o nginx externo estao funcionando.

---

### Como testar se o webhook esta funcionando

Após configurar tudo:

```bash
# Acompanhe os logs do backend em tempo real
docker compose logs -f api
```

Em outro terminal, faca um pagamento de teste pelo painel Woovi.

Nos logs deve aparecer algo sobre webhook recebido. Se o premium for ativado no usuario, esta tudo certo.

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

### Qual compose usar em cada servidor

| Servidor | Compose a usar | `.env` a configurar |
|---|---|---|
| Backend + banco | `DaemonLogs-backend/docker-compose.yml` | `DaemonLogs-backend/.env` |
| So o frontend | `DaemonLogs-frontend/docker-compose.prod.yml` | `DaemonLogs-frontend/.env` |

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

Suba o backend dentro da pasta `DaemonLogs-backend`:

```bash
cd DaemonLogs-backend
docker compose up --build -d
```

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

Suba o frontend dentro da pasta `DaemonLogs-frontend`:

```bash
cd DaemonLogs-frontend
docker compose -f docker-compose.prod.yml up --build -d
```

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

**Deploy unificado:**
1. `.env` na raiz (existe? esta preenchido?)
2. `AUTH_MODE` e `VITE_AUTH_MODE` estao iguais?
3. `PORT=3000` (nao pode ser outra porta no compose raiz)
4. o comando usado no terminal
5. se houve rebuild depois de mudar algo (`--build`)

**Deploy separado:**
1. `DaemonLogs-backend/.env`
2. `DaemonLogs-frontend/.env`
3. o comando e o compose correto para cada pasta
4. se houve rebuild depois de mudar algo do frontend

Fim.
