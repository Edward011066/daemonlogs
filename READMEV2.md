# DaemonLogs README V2

Guia de deploy na VPS para quem quer colocar o projeto no ar sem adivinhar nada.

Este arquivo foi escrito com base nas dificuldades reais que apareceram no deploy:

- conflito entre nginx externo e porta do frontend
- `502 Bad Gateway`
- bloco HTTPS criado cedo demais no nginx
- conflito de server name no nginx
- callback do Discord apontando para a URL errada
- webhook da Woovi configurado com URL ou segredo errados
- compose separado do backend quebrando com senha de banco contendo `@`, `#` ou `!`

Se voce seguir este guia na ordem, o caminho fica previsivel.

---

## Sumario

1. [O que este guia cobre](#o-que-este-guia-cobre)
2. [Arquitetura real do projeto](#arquitetura-real-do-projeto)
3. [Conceitos minimos de Docker, portas e nginx](#conceitos-minimos-de-docker-portas-e-nginx)
4. [Qual `.env` usar em cada cenario](#qual-env-usar-em-cada-cenario)
5. [Cenario recomendado: tudo em uma VPS](#cenario-recomendado-tudo-em-uma-vps)
6. [Passo a passo completo do deploy unificado](#passo-a-passo-completo-do-deploy-unificado)
7. [Discord OAuth2 explicado do jeito certo](#discord-oauth2-explicado-do-jeito-certo)
8. [Woovi PIX explicado do jeito certo](#woovi-pix-explicado-do-jeito-certo)
9. [Subindo apenas o backend em `DaemonLogs-backend`](#subindo-apenas-o-backend-em-daemonlogs-backend)
10. [Subindo apenas o frontend em `DaemonLogs-frontend`](#subindo-apenas-o-frontend-em-daemonlogs-frontend)
11. [Erros comuns e como resolver](#erros-comuns-e-como-resolver)
12. [FAQ eficaz](#faq-eficaz)
13. [Resumo rapido](#resumo-rapido)

---

## O que este guia cobre

Este READMEV2 ensina tres cenarios:

1. Deploy unificado na raiz do projeto
   Frontend + backend + PostgreSQL na mesma VPS.

2. Deploy separado so do backend
   Usando a pasta `DaemonLogs-backend`.

3. Deploy separado so do frontend
   Usando a pasta `DaemonLogs-frontend`.

Tambem explica:

- como copiar `.env.example` para `.env`
- como preencher o `.env` sem chutar valores
- como instalar Docker de forma atual no Ubuntu
- como criar o nginx externo pela primeira vez
- como gerar certificado com Certbot sem cair no erro de SSL cedo demais
- como configurar Discord OAuth2 com as URLs corretas
- como configurar Woovi com os campos corretos e a URL correta do webhook

---

## Arquitetura real do projeto

No repositorio existem tres pecas principais:

1. `DaemonLogs-backend`
   API Fastify + Prisma + PostgreSQL + regras de negocio.

2. `DaemonLogs-frontend`
   Aplicacao React/Vite servida por nginx dentro do container.

3. `docker-compose.yml` na raiz
   Stack unificada para subir tudo junto.

### Como as partes conversam no deploy unificado

```text
Navegador do usuario
        |
        v
nginx da VPS (externo)
        |
        v
container frontend (nginx interno)
        |
        +--> GET /           -> arquivos React
        |
        +--> GET /api/...    -> api:3000
                               |
                               v
                            postgres:5432
```

### O detalhe mais importante

No deploy unificado:

- o usuario acessa o dominio publico
- o nginx externo da VPS recebe em `80` e `443`
- esse nginx externo encaminha para o container frontend em `127.0.0.1:5000`
- o nginx interno do frontend encaminha `/api/*` para o backend em `api:3000`
- o backend conversa com o banco em `postgres:5432`

Ou seja:

- `FRONTEND_PORT` e uma porta do host
- `PORT=3000` e a porta interna do backend
- `5432` e a porta interna do Postgres

---

## Conceitos minimos de Docker, portas e nginx

Se voce e leigo, esta parte evita metade dos erros.

### O que e Docker

Docker e uma forma de empacotar um programa com tudo que ele precisa para rodar.

Pense assim:

- imagem Docker = molde pronto
- container = instancia rodando desse molde
- volume = dados persistentes
- rede Docker = conversa privada entre containers
- `docker compose` = sobe varios containers conectados de uma vez

### O que `docker compose up --build -d` faz

- `up` sobe os servicos
- `--build` reconstrui as imagens antes de subir
- `-d` roda em background

### Porta interna x porta externa

Exemplo:

```text
5000:80
```

Significa:

- `5000` = porta do host/VPS
- `80` = porta dentro do container

No frontend deste projeto, o container nginx sempre escuta em `80`.
O que muda e a porta publicada no host.

### Por que `FRONTEND_PORT` deve ser `5000` quando existe nginx externo

Porque o nginx externo da VPS usa `80` e `443`.

Se voce tentar publicar o container frontend tambem na `80`, acontece conflito:

```text
Error response from daemon: failed to bind host port 0.0.0.0:80: address already in use
```

O jeito certo e:

- nginx externo usa `80` e `443`
- frontend Docker usa `5000`
- nginx externo faz `proxy_pass http://127.0.0.1:5000`

### Nginx interno x nginx externo

Este projeto tem dois nginx diferentes:

1. nginx interno
   Fica dentro do container frontend.
   Serve o React e faz proxy `/api/* -> api:3000`.

2. nginx externo
   Voce instala na VPS.
   Recebe trafego do dominio e encaminha para `127.0.0.1:5000`.

Voce so configura manualmente o nginx externo.

---

## Qual `.env` usar em cada cenario

| Cenario | Arquivo `.env` usado de verdade | Compose usado |
|---|---|---|
| Tudo junto em uma VPS | `.env` na raiz | `docker-compose.yml` da raiz |
| So backend | `DaemonLogs-backend/.env` | `DaemonLogs-backend/docker-compose.yml` |
| So frontend | `DaemonLogs-frontend/.env` | `DaemonLogs-frontend/docker-compose.prod.yml` |

Regra de ouro:

- `.env.example` e so modelo
- `.env` e o arquivo real usado no deploy

---

## Cenario recomendado: tudo em uma VPS

Se voce quer o caminho mais simples e com menos pontos de erro, use o deploy unificado.

Use este cenario quando:

- voce tem uma VPS so
- voce quer um dominio unico, por exemplo `https://app.seudominio.com`
- voce quer que o frontend publique a API por `/api`

Nesse modo:

- um unico `.env` na raiz configura tudo
- o backend nao precisa de dominio separado
- o webhook da Woovi usa `/api/webhooks/woovi`
- o callback publico do Discord usa `/api/auth/discord/callback`

---

## Passo a passo completo do deploy unificado

### 0. O que voce precisa antes de comecar

Antes de rodar qualquer comando, confirme:

1. Sua VPS usa Ubuntu recente.
   A documentacao atual do Docker cita suporte oficial a Ubuntu 22.04, 24.04 e 26.04.

2. Seu dominio ja aponta para o IP da VPS.
   Crie um registro `A` no DNS antes do Certbot.

3. As portas `80` e `443` estao abertas na VPS/firewall.

4. Voce tem acesso SSH com `sudo`.

5. Se voce usa firewall tipo UFW, lembre que portas publicadas pelo Docker podem contornar regras do firewall. Isso e um aviso da propria documentacao do Docker.

### 1. Instalar Docker Engine no Ubuntu

Fluxo baseado na documentacao atual do Docker usando o repositorio oficial APT.

```bash
sudo apt update
sudo apt install ca-certificates curl git -y

sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

Valide:

```bash
sudo systemctl status docker
sudo docker run hello-world
docker compose version
```

Se seu usuario ainda nao pode rodar Docker sem `sudo`, voce tem duas opcoes:

1. continuar usando `sudo docker ...`
2. adicionar o usuario ao grupo docker depois

Para um usuario comum:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clonar o projeto na VPS

```bash
cd /opt
sudo git clone https://github.com/Edward011066/daemonlogs.git daemonlogs
sudo chown -R $USER:$USER /opt/daemonlogs
cd /opt/daemonlogs
```

Se preferir outra pasta, tudo bem. O importante e entrar na raiz do repositorio antes dos proximos passos.

### 3. Copiar `.env.example` para `.env`

Na raiz do projeto:

```bash
cp .env.example .env
```

Agora edite:

```bash
nano .env
```

### 4. Como preencher o `.env` da raiz sem erro

Esta e a parte mais importante do deploy.

#### Bloco Compose

```env
FRONTEND_PORT=5000
```

Use `5000` quando houver nginx externo na VPS.

Nao use `80` aqui se o nginx externo tambem estiver instalado na mesma maquina.

#### Bloco banco de dados

```env
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=sua_senha_forte_aqui
POSTGRES_DB=daemonlogs_db
```

No deploy unificado da raiz, voce nao precisa escrever `DATABASE_URL`.
O compose monta a URL automaticamente em runtime e faz URL-encoding da senha.

Isso significa que senhas como estas funcionam:

```text
SenhaCom@Arroba
Senha#ComCerquilha
Senha!ComExclamacao
```

#### Bloco JWT

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Cole o resultado em:

```env
JWT_SECRET=cole_aqui_o_hex_gerado
```

#### Bloco de autenticacao

Escolha um dos dois modos.

Modo local:

```env
AUTH_MODE=local
VITE_AUTH_MODE=local
```

Modo Discord:

```env
AUTH_MODE=discord
VITE_AUTH_MODE=discord
```

Esses dois valores precisam ser iguais.

#### Bloco da aplicacao

```env
PORT=3000
NODE_ENV=production
APP_URL=https://seudominio.com/
SWAGGER_ENABLED=false
```

Regra critica:

- `PORT` deve ficar `3000` no deploy unificado

O nginx interno do projeto faz proxy para `api:3000`.
Se voce trocar para `5000`, vai quebrar o healthcheck e o proxy.

#### Bloco SMTP

So e obrigatorio se voce estiver em `AUTH_MODE=local` e quiser email real.

Para teste simples sem email:

```env
EMAIL_ENABLED=false
```

#### Bloco Discord

So preencha se `AUTH_MODE=discord`.

No deploy unificado, use:

```env
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://seudominio.com/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://seudominio.com/auth/callback
```

As duas URLs acima nao sao opcionalmente parecidas. Elas precisam ser exatas.

#### Bloco Woovi

```env
WOOVI_API_KEY=seu_appid_woovi
WOOVI_WEBHOOK_SECRET=
WOOVI_CHARGE_VALUE_CENTS=2000
```

Regra atual:

- `WOOVI_API_KEY` = AppID da API/Plugin da Woovi
- esse AppID e enviado no header `Authorization` sem `Bearer`
- o projeto valida automaticamente o header moderno `x-webhook-signature`
- `WOOVI_WEBHOOK_SECRET` hoje e opcional e so serve se voce quiser manter compatibilidade com o metodo legado `X-OpenPix-Signature` baseado em HMAC

Se voce nao sabe o que colocar em `WOOVI_WEBHOOK_SECRET`, deixe vazio.

### 5. Exemplo minimo de `.env` para deploy com Discord e Woovi

```env
FRONTEND_PORT=5000

VITE_AUTH_MODE=discord

POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=sua_senha_forte@123
POSTGRES_DB=daemonlogs_db

JWT_SECRET=gere_um_hex_aleatorio_longo

AUTH_MODE=discord

DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://seudominio.com/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://seudominio.com/auth/callback

PORT=3000
NODE_ENV=production
APP_URL=https://seudominio.com/
SWAGGER_ENABLED=false

EMAIL_ENABLED=false

REFERRAL_PREMIUM_THRESHOLD=5
RATE_LIMIT_GLOBAL_MAX=120
RATE_LIMIT_WINDOW_MS=60000
MY_TOKEN_COOLDOWN_HOURS=24

WOOVI_API_KEY=seu_appid_woovi
WOOVI_WEBHOOK_SECRET=
WOOVI_CHARGE_VALUE_CENTS=2000
```

### 6. Subir a stack antes do nginx externo

Na raiz do projeto:

```bash
docker compose up --build -d
docker compose ps
```

Voce quer ver algo assim:

```text
daemonlogs-postgres   Up (healthy)
daemonlogs-api        Up (healthy)
daemonlogs-frontend   Up
```

No deploy unificado correto, o frontend deve estar publicado em `5000`:

```text
0.0.0.0:5000->80/tcp
```

### 7. Instalar nginx externo na VPS

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 8. Criar a configuracao inicial do nginx sem HTTPS ainda

Este passo e importante.

Nao crie o bloco `listen 443 ssl;` manualmente antes do certificado existir.
Foi exatamente isso que causou o erro:

```text
no "ssl_certificate" is defined for the "listen ... ssl" directive
```

O caminho seguro e:

1. criar primeiro um bloco so com `80`
2. validar
3. rodar o Certbot
4. deixar o Certbot editar a configuracao HTTPS

Crie o arquivo:

```bash
sudo nano /etc/nginx/sites-available/daemonlogs
```

Cole isto, trocando o dominio:

```nginx
server {
    listen 80;
    server_name seudominio.com;

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

Ative:

```bash
sudo ln -s /etc/nginx/sites-available/daemonlogs /etc/nginx/sites-enabled/daemonlogs
```

Se o link ja existir, nao e erro grave. So significa que ele ja esta ativo.

### 9. Limpar configuracoes antigas conflitantes do nginx

Liste:

```bash
ls -l /etc/nginx/sites-enabled/
```

Se houver outro arquivo antigo usando o mesmo dominio, remova o link dele.

Exemplo:

```bash
sudo rm /etc/nginx/sites-enabled/duciferzinho.com
```

Isso evita o aviso:

```text
conflicting server name "seudominio.com"
```

### 10. Validar e recarregar o nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Se `nginx -t` falhar, corrija isso antes do Certbot.

### 11. Instalar Certbot pelo caminho atual recomendado

A pagina atual do Certbot para nginx em Linux recomenda o pacote snap.

```bash
sudo apt install snapd -y
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
```

Se o comando `certbot` ja existir na sua VPS, voce pode pular a instalacao.

### 12. Gerar o certificado

Com o site respondendo em HTTP na porta `80`:

```bash
sudo certbot --nginx -d seudominio.com
```

O Certbot vai:

1. validar o dominio
2. gerar o certificado
3. editar a configuracao do nginx automaticamente
4. criar o bloco HTTPS
5. recarregar o nginx

Depois valide a renovacao:

```bash
sudo certbot renew --dry-run
```

### 13. Testes finais do deploy unificado

```bash
docker compose ps
docker compose logs -f api
```

E abra no navegador:

```text
https://seudominio.com
```

Se o frontend abrir e a API responder, o deploy base ficou pronto.

Observacao importante sobre o status `healthy`:

- na versao atual do projeto, o `/health` da API tambem testa conectividade real com o banco
- entao `daemonlogs-api Up (healthy)` agora significa que a API conseguiu falar com o Postgres naquele momento
- se a API estiver subindo mas o banco estiver com senha errada, o esperado agora e o container nao ficar saudavel

---

## Discord OAuth2 explicado do jeito certo

### O que este projeto faz no Discord

O backend implementa o fluxo OAuth2 Authorization Code.

Segundo a documentacao oficial atual do Discord:

- o usuario vai para `https://discord.com/oauth2/authorize`
- o Discord redireciona de volta para o `redirect_uri`
- o backend troca o `code` por token em `https://discord.com/api/oauth2/token`
- o backend busca o perfil do usuario
- o backend gera um JWT proprio do sistema

No codigo atual deste projeto, o backend gera a URL de autorizacao sozinho e pede apenas os escopos `identify` e `email`.

Em outras palavras: este projeto usa o Discord para login do usuario, nao para instalar bot, nao para pedir permissao de servidor e nao para criar webhook do Discord.

### Scopes usados por este projeto

No codigo atual, o projeto pede apenas:

- `identify`
- `email`

Isso esta de acordo com a documentacao oficial atual do Discord:

- `identify` permite ler o perfil basico do usuario
- `email` permite que `/users/@me` retorne o email do usuario

### Quais scopes marcar no Discord

Para este projeto, se voce abrir o `OAuth2 URL Generator` do Discord so para inspecionar ou testar, marque apenas:

- `identify`
- `email`

Nao marque estes escopos para este login:

- `bot`
- `applications.commands`
- `guilds.join`
- `webhook.incoming`
- qualquer outro scope que voce nao use de verdade

Se voce marcar escopos a mais, o fluxo pode pedir consentimentos desnecessarios e deixar a configuracao mais confusa.

### O que fazer no portal do Discord, passo a passo

1. Entre em `https://discord.com/developers/applications`
2. Clique em `New Application`
3. Dê um nome para a aplicacao
4. Abra a aplicacao criada

Agora voce vai lidar com tres coisas diferentes:

1. `Application ID`
   E o identificador publico da sua app.
   Voce copia do Discord para o `.env` em `DISCORD_CLIENT_ID`.

2. `Client Secret`
   E o segredo privado da sua app.
   Voce copia do Discord para o `.env` em `DISCORD_CLIENT_SECRET`.

3. `Redirect URI`
   E a URL para onde o Discord vai devolver o usuario depois do login.
   Essa URL nao nasce pronta no portal. Voce define com base no seu deploy e registra a mesma string nos dois lugares: no seu `.env` e na lista de Redirects do Discord.

### Onde achar cada campo no portal

#### Application ID

No portal do Discord:

- abra sua app
- va em `General Information`
- copie `Application ID`

Cole no `.env`:

```env
DISCORD_CLIENT_ID=cole_aqui_o_application_id
```

#### Client Secret

No portal do Discord:

- abra sua app
- va em `OAuth2`
- copie `Client Secret`

Cole no `.env`:

```env
DISCORD_CLIENT_SECRET=cole_aqui_o_client_secret
```

### A diferenca entre as duas URLs importantes deste projeto

Este projeto usa duas URLs diferentes, e elas confundem muita gente.

#### 1. `DISCORD_REDIRECT_URI`

Esta e a URL de callback do backend.

Fluxo:

- usuario clica em login com Discord
- vai para o Discord
- o Discord devolve o usuario para esta URL
- esta URL precisa estar registrada no portal do Discord

Deploy unificado:

```env
DISCORD_REDIRECT_URI=https://seudominio.com/api/auth/discord/callback
```

Deploy separado:

```env
DISCORD_REDIRECT_URI=https://api.seudominio.com/auth/discord/callback
```

#### 2. `DISCORD_OAUTH_FRONTEND_REDIRECT`

Esta e a URL do frontend para onde o seu proprio backend redireciona depois que ja trocou o `code` por token e criou o JWT.

O Discord nao chama essa URL diretamente.

Ela nao entra na lista de Redirects do portal do Discord.

Ela existe so dentro do seu sistema.

Deploy unificado:

```env
DISCORD_OAUTH_FRONTEND_REDIRECT=https://seudominio.com/auth/callback
```

Deploy separado:

```env
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.seudominio.com/auth/callback
```

Resumo simples:

- `DISCORD_REDIRECT_URI` = Discord -> seu backend
- `DISCORD_OAUTH_FRONTEND_REDIRECT` = seu backend -> seu frontend

### O que copiar de la para ca e o que copiar daqui para la

#### Do portal do Discord para o `.env`

Voce copia:

- `Application ID` -> `DISCORD_CLIENT_ID`
- `Client Secret` -> `DISCORD_CLIENT_SECRET`

#### Do seu planejamento de deploy para o `.env`

Voce define:

- `DISCORD_REDIRECT_URI`
- `DISCORD_OAUTH_FRONTEND_REDIRECT`

Essas URLs dependem do seu dominio e da sua arquitetura.

#### Do `.env` para o portal do Discord

Depois de definir a URL correta de callback no `.env`, voce copia exatamente o valor de `DISCORD_REDIRECT_URI` e cadastra essa mesma string na lista de Redirects do portal.

Ou seja:

- `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`: Discord -> projeto
- `DISCORD_REDIRECT_URI`: projeto -> Discord e projeto
- `DISCORD_OAUTH_FRONTEND_REDIRECT`: so projeto

### Onde configurar o Redirect URI no portal

1. No portal da app, va em `OAuth2`
2. Procure a area de `Redirects`
3. Clique para adicionar uma nova Redirect URI
4. Cole exatamente o valor de `DISCORD_REDIRECT_URI`
5. Salve

Exemplo de deploy unificado:

```text
https://seudominio.com/api/auth/discord/callback
```

Exemplo de deploy separado:

```text
https://api.seudominio.com/auth/discord/callback
```

Se houver uma letra, barra ou protocolo diferente entre o portal e o `.env`, o login quebra.

### O que e a URL gerada no `OAuth2 URL Generator`

No portal do Discord existe uma area chamada `OAuth2 URL Generator`.

Ela gera uma URL parecida com isto:

```text
https://discord.com/oauth2/authorize?client_id=...&scope=identify%20email&response_type=code&redirect_uri=...
```

Essa URL e apenas o link de autorizacao do Discord.

Ela nao substitui nenhuma variavel do `.env`.

Voce nao cola essa URL inteira em `DISCORD_CLIENT_ID`, nem em `DISCORD_REDIRECT_URI`, nem em `DISCORD_OAUTH_FRONTEND_REDIRECT`.

Neste projeto, essa URL normalmente nem precisa ser usada manualmente, porque o backend ja a gera sozinho na rota de login do Discord.

Entao a regra pratica e:

- use o `OAuth2 URL Generator` apenas para entender ou testar
- nao use a URL gerada como configuracao do projeto
- nao marque scopes extras ali

### O que pode ser ignorado no portal para este projeto

A documentacao oficial atual do Discord fala bastante sobre:

- `Install Links`
- `Discord Provided Link`
- `Custom URL`
- `bot`
- `applications.commands`
- `Installation Contexts`

Isso costuma ser importante para apps instalaveis, slash commands e bots.

Para este fluxo especifico de login do DaemonLogs, isso nao e o foco.

Se sua meta e apenas autenticar usuario via Discord, foque apenas em:

- criar a app
- copiar `Application ID`
- copiar `Client Secret`
- registrar o `DISCORD_REDIRECT_URI`
- manter os scopes em `identify` e `email`

### Valores corretos para cada cenario

#### Deploy unificado

```env
AUTH_MODE=discord
VITE_AUTH_MODE=discord
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://seudominio.com/api/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://seudominio.com/auth/callback
```

#### Deploy separado

```env
AUTH_MODE=discord
VITE_AUTH_MODE=discord
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://api.seudominio.com/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.seudominio.com/auth/callback
```

### Como testar se a configuracao do Discord ficou certa

Depois do sistema no ar:

1. abra a pagina de login do frontend
2. clique em login com Discord
3. veja se o navegador vai para o Discord
4. autorize a app
5. confirme se voce volta para `/auth/callback`
6. confirme se o frontend te leva ao dashboard

Se quiser testar pela URL publica do backend:

- deploy unificado: abra `https://seudominio.com/api/auth/discord`
- deploy separado: abra `https://api.seudominio.com/auth/discord`

### Checklist final do bloco Discord

- `AUTH_MODE=discord`
- `VITE_AUTH_MODE=discord`
- `DISCORD_CLIENT_ID` veio do portal do Discord
- `DISCORD_CLIENT_SECRET` veio do portal do Discord
- `DISCORD_REDIRECT_URI` foi definido por voce e cadastrado igualzinho no portal
- `DISCORD_OAUTH_FRONTEND_REDIRECT` foi definido por voce e aponta para `/auth/callback`
- scopes usados pelo projeto: apenas `identify` e `email`
- voce nao usou a URL inteira do `OAuth2 URL Generator` como valor de `.env`

---

## Woovi PIX explicado do jeito certo

### O que este projeto faz na Woovi

O sistema cria uma cobranca PIX pela API da Woovi e ativa premium quando recebe o evento:

```text
OPENPIX:CHARGE_COMPLETED
```

### O que a documentacao atual da Woovi diz sobre a chave da API

Na documentacao atual:

- voce cria uma API/Plugin em `API/Plugins`
- copia o `AppID`
- envia esse AppID no header `Authorization`
- sem o prefixo `Bearer`

Logo, neste projeto:

```env
WOOVI_API_KEY=seu_appid
```

### O que a documentacao atual da Woovi diz sobre seguranca do webhook

A Woovi hoje documenta dois metodos:

1. `x-webhook-signature`
   Metodo recomendado atual.
   Validado com a chave publica da Woovi.

2. `X-OpenPix-Signature`
   Metodo HMAC legado/depreciado.
   Validado com um secret do webhook.

O codigo atual do projeto ja foi ajustado para:

- validar automaticamente `x-webhook-signature`
- aceitar `X-OpenPix-Signature` como fallback legado, se `WOOVI_WEBHOOK_SECRET` estiver preenchido

Por isso hoje:

```env
WOOVI_WEBHOOK_SECRET=
```

pode ficar vazio na configuracao comum.

### Onde criar a API/Plugin

1. Entre em `https://app.woovi.com`
2. Va em `API/Plugins`
3. Clique para criar uma nova API/Plugin
4. Escolha um nome
5. Ative a autenticacao exigida pela plataforma
6. Copie o `AppID`

### URL correta do webhook no deploy unificado

Como o dominio publico entra pelo frontend e o frontend publica a API por `/api`, a URL correta e:

```text
https://seudominio.com/api/webhooks/woovi
```

Nao use apenas o dominio raiz.

Isto esta errado:

```text
https://seudominio.com/
```

Isto esta certo:

```text
https://seudominio.com/api/webhooks/woovi
```

### Como criar o webhook na plataforma Woovi

1. Va em `API/Plugins` -> `Webhooks`
2. Clique em criar webhook
3. Preencha:

| Campo | Valor |
|---|---|
| Nome | daemonlogs |
| Evento | `OPENPIX:CHARGE_COMPLETED` |
| URL | `https://seudominio.com/api/webhooks/woovi` |

4. Salve

Segundo a documentacao atual da Woovi, ela faz um teste no endpoint e espera `HTTP 200`.

Entao a ordem correta e:

1. subir Docker
2. configurar nginx
3. configurar HTTPS
4. salvar o webhook na Woovi

### Valor da cobranca

```env
WOOVI_CHARGE_VALUE_CENTS=2000
```

`2000` significa `R$ 20,00`.

### Como acompanhar se o webhook esta chegando

```bash
docker compose logs -f api
```

Na plataforma Woovi voce tambem pode abrir os logs do webhook para ver:

- request body
- response body
- status code retornado pelo seu endpoint

---

## Subindo apenas o backend em `DaemonLogs-backend`

Use este modo quando:

- voce quer backend e banco em uma VPS separada
- voce quer API em dominio proprio, por exemplo `https://api.seudominio.com`

### 1. Entrar na pasta do backend

```bash
cd /opt/daemonlogs/DaemonLogs-backend
```

### 2. Copiar o `.env.example`

```bash
cp .env.example .env
nano .env
```

### 3. Como preencher o `.env` do backend separado

Exemplo para frontend em outro dominio:

```env
DATABASE_URL=postgresql://daemonlogs:sua_senha_forte@localhost:5432/daemonlogs_db
POSTGRES_USER=daemonlogs
POSTGRES_PASSWORD=sua_senha_forte@123
POSTGRES_DB=daemonlogs_db

JWT_SECRET=gere_um_hex_seguro

AUTH_MODE=discord
DISCORD_CLIENT_ID=seu_client_id
DISCORD_CLIENT_SECRET=seu_client_secret
DISCORD_REDIRECT_URI=https://api.seudominio.com/auth/discord/callback
DISCORD_OAUTH_FRONTEND_REDIRECT=https://app.seudominio.com/auth/callback

PORT=3000
NODE_ENV=production
APP_URL=https://api.seudominio.com
SWAGGER_ENABLED=false

EMAIL_ENABLED=false

WOOVI_API_KEY=seu_appid_woovi
WOOVI_WEBHOOK_SECRET=
WOOVI_CHARGE_VALUE_CENTS=2000
```

Notas importantes:

1. O compose separado do backend agora tambem monta a `DATABASE_URL` de forma segura em runtime para o container.
2. Mesmo assim, mantenha `DATABASE_URL` no `.env` para ferramentas locais, scripts e execucoes fora do Docker.
3. Se o frontend estiver em outro dominio, o callback do Discord deve apontar para o dominio da API.

### 4. Subir o backend

```bash
docker compose up --build -d
docker compose ps
```

### 5. Configurar nginx externo para a API

Crie:

```bash
sudo nano /etc/nginx/sites-available/daemonlogs-api
```

Conteudo inicial HTTP:

```nginx
server {
    listen 80;
    server_name api.seudominio.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

Ative, valide e recarregue:

```bash
sudo ln -s /etc/nginx/sites-available/daemonlogs-api /etc/nginx/sites-enabled/daemonlogs-api
sudo nginx -t
sudo systemctl reload nginx
```

Depois gere o certificado:

```bash
sudo certbot --nginx -d api.seudominio.com
```

### 6. URLs corretas no backend separado

| Item | Valor |
|---|---|
| API publica | `https://api.seudominio.com` |
| Health | `https://api.seudominio.com/health` |
| Discord callback | `https://api.seudominio.com/auth/discord/callback` |
| Woovi webhook | `https://api.seudominio.com/webhooks/woovi` |

---

## Subindo apenas o frontend em `DaemonLogs-frontend`

Use este modo quando:

- o frontend ficara em um servidor separado
- a API ja existe em outro dominio, por exemplo `https://api.seudominio.com`

### 1. Entrar na pasta do frontend

```bash
cd /opt/daemonlogs/DaemonLogs-frontend
```

### 2. Copiar o `.env.example`

```bash
cp .env.example .env
nano .env
```

### 3. Como preencher o `.env` do frontend separado

Exemplo:

```env
FRONTEND_PORT=5000
VITE_API_URL=https://api.seudominio.com
VITE_AUTH_MODE=discord
```

Notas criticas:

1. `VITE_API_URL` deve apontar para a raiz publica da API.
2. Nao use `/api` aqui no deploy separado.
3. `VITE_AUTH_MODE` deve ser igual ao `AUTH_MODE` do backend.
4. `FRONTEND_PORT=5000` evita conflito com nginx externo.

### 4. Subir o frontend separado

```bash
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

### 5. Configurar nginx externo para o frontend separado

Crie:

```bash
sudo nano /etc/nginx/sites-available/daemonlogs-app
```

Conteudo inicial HTTP:

```nginx
server {
    listen 80;
    server_name app.seudominio.com;

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

Ative, valide e recarregue:

```bash
sudo ln -s /etc/nginx/sites-available/daemonlogs-app /etc/nginx/sites-enabled/daemonlogs-app
sudo nginx -t
sudo systemctl reload nginx
```

Depois gere o certificado:

```bash
sudo certbot --nginx -d app.seudominio.com
```

### 6. URLs corretas no frontend separado

| Item | Valor |
|---|---|
| Frontend publico | `https://app.seudominio.com` |
| Frontend callback | `https://app.seudominio.com/auth/callback` |
| API configurada em `VITE_API_URL` | `https://api.seudominio.com` |

---

## Erros comuns e como resolver

### 1. `address already in use` na porta 80

Causa:

- voce colocou `FRONTEND_PORT=80`
- e tambem instalou nginx externo na mesma VPS

Correcao:

```env
FRONTEND_PORT=5000
```

E no nginx externo:

```nginx
proxy_pass http://127.0.0.1:5000;
```

### 2. `502 Bad Gateway`

Causas mais comuns:

1. nginx externo ainda nao foi criado
2. `proxy_pass` aponta para a porta errada
3. frontend container nao esta subido

Checklist:

```bash
docker compose ps
sudo nginx -t
curl http://127.0.0.1:5000
```

### 3. `conflicting server name`

Causa:

- existe outro arquivo antigo em `/etc/nginx/sites-enabled` usando o mesmo dominio

Resolucao:

```bash
ls -l /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/arquivo-antigo
sudo nginx -t
sudo systemctl reload nginx
```

### 4. `no "ssl_certificate" is defined`

Causa:

- voce criou manualmente um bloco `listen 443 ssl;` antes de gerar o certificado

Resolucao:

- remova o bloco HTTPS manual
- deixe apenas o bloco HTTP
- valide o nginx
- rode `sudo certbot --nginx -d seudominio.com`

### 5. Discord autentica, mas o frontend nao loga

Causa mais comum:

- `DISCORD_OAUTH_FRONTEND_REDIRECT` esta apontando para `/` em vez de `/auth/callback`

Correto:

```env
DISCORD_OAUTH_FRONTEND_REDIRECT=https://seudominio.com/auth/callback
```

### 6. Discord redirect URI invalida

Causa:

- a URL do `.env` nao bate exatamente com a do portal do Discord

Resolucao:

- copie e cole a mesma string nos dois lugares
- confira `https`, dominio, caminho e barra final

### 7. Woovi nao salva o webhook

Causas comuns:

1. endpoint ainda nao esta publico
2. HTTPS ainda nao existe
3. URL do webhook esta errada

Deploy unificado:

```text
https://seudominio.com/api/webhooks/woovi
```

Deploy backend separado:

```text
https://api.seudominio.com/webhooks/woovi
```

### 8. Banco falha com `P1000`

Causas comuns:

1. senha errada
2. volume do Postgres criado com credencial antiga
3. `DATABASE_URL` montada manualmente de forma errada

Se voce trocou a senha depois da primeira subida e quer recriar tudo do zero:

```bash
docker compose down -v
docker compose up --build -d
```

Se voce mudou `POSTGRES_PASSWORD` depois que o banco ja existia, esse costuma ser exatamente o motivo do erro.

### 9. API aparece `healthy`, mas o login Discord falha com erro de banco

Em versoes antigas do projeto, o `health` nao confirmava o banco de dados.

Na versao atual isso foi corrigido.

Entao, daqui para frente:

- se a API estiver `healthy`, ela tambem conseguiu acessar o banco
- se o callback do Discord falhar com erro de banco, verifique se a VPS ainda esta rodando uma imagem antiga sem essa correcao

### 10. Mudei `.env` do frontend e nada aconteceu

O frontend usa Vite.
Variaveis `VITE_*` entram no build.

Entao sempre refaca a imagem:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

---

## FAQ eficaz

### 1. Mudei `POSTGRES_PASSWORD` no `.env`. Preciso apagar o volume antigo?

Na maioria dos casos, sim.

Na imagem oficial do Postgres, `POSTGRES_PASSWORD` e usada na criacao inicial do banco. Se o volume ja existia, mudar o `.env` depois nao reconfigura automaticamente o usuario ja criado.

Se voce pode perder os dados atuais:

```bash
docker compose down -v
docker compose up --build -d
```

Se voce nao pode perder os dados, altere a senha dentro do Postgres em vez de apagar o volume.

### 2. O erro apareceu no callback do Discord. O problema e do Discord?

Nem sempre.

Se o Discord redirecionou voce de volta para `/api/auth/discord/callback` com `code` e `state`, o OAuth2 chegou ate a sua API.

Se a resposta final mostra `P1000`, `P1001` ou outro erro do Prisma, o problema ja saiu do Discord e entrou na etapa de banco de dados.

### 3. Qual e o comando mais seguro para resetar tudo quando estou montando a VPS do zero?

Se voce ainda nao precisa preservar dados:

```bash
docker compose down -v
docker compose up --build -d
docker compose ps
docker compose logs -f api
```

Esse fluxo resolve boa parte dos erros de volume antigo, senha antiga e imagem antiga.

### 4. Como eu sei se o problema esta no nginx ou na aplicacao?

Use esta ordem:

```bash
docker compose ps
docker compose logs -f api
curl http://127.0.0.1:5000
curl http://127.0.0.1:5000/api/health
sudo nginx -t
```

Leitura rapida:

- se `127.0.0.1:5000` nao responde, o problema esta antes do nginx externo
- se `127.0.0.1:5000` responde mas o dominio da `502`, olhe o nginx externo
- se `/api/health` falha, olhe API e banco

### 5. Posso usar manualmente a URL gerada no `OAuth2 URL Generator` do Discord?

Use apenas para entender ou testar, nao como fluxo principal do projeto.

Neste sistema, o backend gera a URL de autorizacao sozinho na rota:

- deploy unificado: `https://seudominio.com/api/auth/discord`
- deploy separado: `https://api.seudominio.com/auth/discord`

Isso e melhor porque o backend tambem gera e valida o `state` de seguranca.

### 6. O que eu copio do portal do Discord e o que eu escrevo manualmente?

Do portal do Discord para o `.env`:

- `Application ID` -> `DISCORD_CLIENT_ID`
- `Client Secret` -> `DISCORD_CLIENT_SECRET`

Voce define manualmente, com base no seu dominio:

- `DISCORD_REDIRECT_URI`
- `DISCORD_OAUTH_FRONTEND_REDIRECT`

Depois copie o valor de `DISCORD_REDIRECT_URI` do `.env` para a lista de Redirects no portal.

### 7. Qual URL da Woovi eu devo cadastrar no webhook?

Deploy unificado:

```text
https://seudominio.com/api/webhooks/woovi
```

Backend separado:

```text
https://api.seudominio.com/webhooks/woovi
```

Nao use so o dominio raiz.

### 8. Preciso preencher `WOOVI_WEBHOOK_SECRET`?

Hoje, no fluxo normal, nao.

O projeto foi ajustado para validar o header atual `x-webhook-signature` da Woovi.

`WOOVI_WEBHOOK_SECRET` ficou como compatibilidade opcional com o metodo legado `X-OpenPix-Signature`.

Se voce nao usa esse metodo antigo, pode deixar vazio.

### 9. Quando eu preciso dar `--build` de novo?

Sempre que mudar:

- qualquer variavel `VITE_*` do frontend
- Dockerfile
- dependencias
- arquivos copiados para dentro da imagem

Comandos uteis:

```bash
docker compose up --build -d
docker compose -f docker-compose.prod.yml up --build -d
```

### 10. Exposei `DISCORD_CLIENT_SECRET`, token de sessao ou outra credencial. O que fazer?

Considere o segredo comprometido.

Acoes imediatas:

1. rotacione o `Client Secret` no portal do Discord
2. atualize o `.env`
3. reinicie a stack
4. encerre sessoes que possam ter sido expostas

Nao poste novamente cookies, `authorization`, `Client Secret` ou tokens em logs, screenshots ou chats.

### 11. Quero testar rapidamente se meu callback do Discord esta configurado certo. Como fazer?

Abra a rota publica do backend no navegador:

- deploy unificado: `https://seudominio.com/api/auth/discord`
- deploy separado: `https://api.seudominio.com/auth/discord`

Se o navegador for para a tela do Discord, o inicio do fluxo esta certo.

Se, depois de autorizar, voce voltar para o callback e cair em erro de banco, o problema nao esta no Discord e sim na API ou no Postgres.

### 12. O que eu verifico primeiro quando algo nao sobe?

Use sempre esta sequencia:

```bash
docker compose ps
docker compose logs api
docker compose logs frontend
docker compose logs postgres
sudo nginx -t
```

Isso costuma separar rapido se a falha esta em:

- container
- banco
- nginx
- variavel de ambiente

---

## Resumo rapido

### Se voce vai subir tudo em uma VPS

1. instale Docker
2. clone o repo
3. copie `.env.example` da raiz para `.env`
4. configure `FRONTEND_PORT=5000`
5. configure `PORT=3000`
6. alinhe `AUTH_MODE` e `VITE_AUTH_MODE`
7. suba `docker compose up --build -d`
8. crie nginx HTTP apontando para `127.0.0.1:5000`
9. rode `certbot --nginx -d seu-dominio`
10. configure Discord e Woovi com as URLs corretas

### Se voce vai subir so o backend

1. use `DaemonLogs-backend/.env`
2. suba em `DaemonLogs-backend`
3. nginx externo aponta para `127.0.0.1:3000`
4. Discord callback fica no dominio da API
5. webhook da Woovi fica no dominio da API

### Se voce vai subir so o frontend

1. use `DaemonLogs-frontend/.env`
2. defina `FRONTEND_PORT=5000`
3. defina `VITE_API_URL=https://api.seudominio.com`
4. nginx externo aponta para `127.0.0.1:5000`
5. frontend callback fica em `/auth/callback`

---

Se quiser, o proximo passo natural e transformar este READMEV2 no guia principal da raiz, substituindo o README antigo ou incorporando as partes melhores dele.