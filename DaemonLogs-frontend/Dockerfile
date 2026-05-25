# ── Estágio 1: dependências ─────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ── Estágio 2: desenvolvimento (hot-reload) ──────────────────────────────────
FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ── Estágio 3: build de produção ─────────────────────────────────────────────
FROM deps AS builder
ARG VITE_API_URL=http://localhost:3000
ARG VITE_AUTH_MODE=local
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE
COPY . .
RUN npm run build

# ── Estágio 4: servidor nginx (produção) ─────────────────────────────────────
FROM nginx:1.27-alpine AS prod
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
