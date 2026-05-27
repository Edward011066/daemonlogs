---
description: "Use when: aplicar classes Tailwind, ajustar tokens visuais, definir variantes de cor, spacing ou tipografia, editar src/**/*.tsx, src/**/*.css ou tailwind.config.ts."
applyTo: "src/**/*.tsx,src/**/*.css,tailwind.config.ts"
---

# Estilo e Tema

## Tokens visuais do projeto

| Token Tailwind | Uso |
|---------------|-----|
| `bg-background` | Fundo da página |
| `bg-surface` | Sidebar, painéis, cards |
| `bg-surface-2` | Cards aninhados, inputs |
| `border-border` | Bordas padrão |
| `text-foreground` | Texto principal |
| `text-muted-foreground` | Labels, textos secundários |
| `bg-accent / text-accent-foreground` | Ação primária, nav ativo |
| `text-destructive` | Erros, deletar |
| `text-success` | Online, válido, sucesso |
| `text-warning` | Avisos, limites, quotas |
| `text-info` | Eventos de voz, informativos |

## Regras centrais

- Nunca escreva cores literais em JSX; use tokens Tailwind já configurados.
- Nunca concatene classes manualmente; use `cn()`.
- Use utilitários de opacidade do Tailwind em vez de `rgba(...)`.
- Use `style={{}}` apenas para valores realmente dinâmicos de runtime que não possam virar classe.
- Ícones sempre com tamanho explícito (`h-*` e `w-*`).

## Hierarquia visual para dados complexos

- Cada tela deve ter no máximo 3 planos visuais claros: fundo da página, superfícies primárias e superfícies secundárias.
- Use `bg-surface` para blocos principais e `bg-surface-2` para metadado, filtros, chips técnicos e blocos auxiliares.
- Não trate todo card como protagonista. Um ou dois blocos dominantes por viewport bastam.
- Use cor de destaque para ação, seleção e status importante; não pinte todas as superfícies com acento.
- Metadados técnicos devem parecer secundários: `font-mono`, texto menor e contraste mais baixo.

## Layout responsivo para master-detail

- Cards de overview: `grid-cols-1`, `sm:grid-cols-2`, `xl:grid-cols-4` como padrão de progressão.
- Layouts master-detail devem empilhar em telas pequenas e abrir duas colunas apenas quando houver largura real.
- Filtros, métricas e ações primárias devem aparecer antes da lista principal, nunca disputando espaço com o detalhe técnico.
- Em desktop, preserve área suficiente para tabela/lista e detalhe lado a lado quando a tarefa envolver comparação.
- Em mobile, prefira sequência linear com CTA claras e detalhe em dialog/página dedicada.

## Densidade e legibilidade

- Resumos textuais longos devem ser truncados ou limitados por linhas; o texto completo fica no detalhe.
- IDs, hashes, timestamps completos e valores operacionais devem ser agrupados em blocos compactos, nunca espalhados como headline.
- Use bordas, separadores e contraste para agrupar informações relacionadas antes de recorrer a mais cor.
- Se uma superfície já tiver título, métrica e ação primária, evite adicionar chips decorativos extras sem função informacional.

## Proibido

- `style={{}}` para cor, layout estático ou valores que possam ser expressos por classes/tokens Tailwind
- Valores arbitrários de cor `text-[#...]` ou `bg-[#...]`
- Gradientes inline (`background: linear-gradient(...)`)
- Efeitos de brilho/glow (box-shadow coloridos em componentes de negócio)
- Emoji de caractere Unicode (use ícones Lucide)
- `!important` em Tailwind (`!text-red-500`) — refatore a especificidade
