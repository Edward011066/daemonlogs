---
name: estruturar-tela-entidade
description: "Use when: montar tela de entidade, separar summary/detail/subviews, reduzir dump visual de payload, planejar master-detail, definir lazy loading de relações."
argument-hint: "Informe a entidade ou endpoint principal"
user-invocable: true
---

# Estruturar Tela de Entidade

Acione esta skill para planejar ou refatorar telas guiadas por entidade sem despejar o payload bruto.

## Steps
1. **Encontrar a entidade principal:** Abra `api-endpoints.json` e confirme qual recurso controla a tela, quais campos têm valor imediato e quais relações podem crescer.
2. **Separar níveis de informação:** Defina o que entra no summary, no detalhe, nas subviews e no drill-down técnico antes de desenhar componentes.
3. **Escolher a superfície de detalhe:** Use sheet, dialog, split view ou página dedicada conforme comparação e espaço disponível.
4. **Cortar coleções secundárias:** Relações `1->N`, logs, eventos, pagamentos e blocos técnicos devem carregar sob demanda e aparecer como preview curto no overview.
5. **Preservar a hierarquia visual:** Nomes, status e métricas primeiro; IDs, hashes, tokens e timestamps completos ficam como metadado secundário.
6. **Revisar a entrega:** Confirme qual é a master view, qual é o detalhe, quais seções carregam sob demanda e como a UI evita dump do payload.

## Regras estritas durante a execução
- Não misture overview, configuração e diagnóstico técnico no mesmo bloco visual.
- Não expanda listas profundas dentro da listagem principal.
- Não trate campos técnicos como headline quando houver informação humana mais útil.