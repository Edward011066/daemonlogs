---
name: integrar-endpoint-api
description: "Use when: integrar endpoint da API, criar hook query ou mutation a partir de api-endpoints.json, revisar contrato cru, tratar ApiError, modelar polling 202."
argument-hint: "Informe o endpoint e o fluxo desejado"
user-invocable: true
---

# Integrar Endpoint da API

Acione esta skill para ligar uma rota da API ao frontend sem inventar contrato nem espalhar lógica fora do data layer.

## Steps
1. **Validar a spec:** Abra `api-endpoints.json` e confirme path, params, body, status codes e shape mínimo da resposta.
2. **Localizar superfície existente:** Verifique hooks, tipos e consumidores vizinhos antes de criar novo código; reutilize `apiFetch()` e query keys compatíveis com o módulo.
3. **Definir contrato cru:** Em tipos compartilhados, preserve os nomes do backend. Se a UI precisar de alias, derive localmente.
4. **Implementar o data layer:** Crie ou ajuste `useQuery`/`useMutation` com `enabled`, `refetchInterval` ou invalidação somente quando o fluxo pedir.
5. **Tratar erro e 202:** Use `ApiError` para lógica e apresentação. Se o endpoint devolver `202`, modele polling ou reconsulta do status documentado em vez de bloquear a UI.
6. **Validar o encaixe:** Revise se o hook usa `apiFetch()`, query key estável, snowflakes como `string` e nenhum campo especulativo.

## Regras estritas durante a execução
- Não invente endpoint, header, campo ou status code fora da spec.
- Não promova aliases amigáveis para `src/types/index.ts`.
- Não use `fetch()` direto nem duplique autenticação fora de `src/lib/api.ts` e `src/lib/auth.ts`.