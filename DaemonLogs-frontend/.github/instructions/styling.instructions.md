---
description: "Use when: estilizar componente, reestruturar UI, reduzir sobrecarga visual, adicionar classe Tailwind, definir cor, criar variante visual, configurar tema, trabalhar em src/**/*.tsx, src/**/*.css, tailwind.config.ts."
applyTo: "src/**/*.tsx,src/**/*.css,tailwind.config.ts"
---

# Estilo e Tema

## Tokens de cor — preserve o sistema atual

O projeto já possui um sistema de tokens definido em `src/index.css` e exposto pelo `tailwind.config.ts`. Preserve esse sistema, mas use os tokens para criar hierarquia visual real em vez de repetir blocos visuais idênticos:

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

**Referência de valores** (para configurar `tailwind.config.ts`):

```css
/* src/index.css — variáveis HSL para shadcn/ui */
:root {
  --background:   231 15% 18%;   /* #282a36 */
  --surface:      232 16% 14%;   /* #21222c */
  --surface-2:    232 14% 16%;   /* #26273a */
  --border:       228 12% 30%;   /* #44475a */
  --foreground:   60  30% 96%;   /* #f8f8f2 */
  --muted:        225 27% 51%;   /* #6272a4 */
  --muted-foreground: 225 27% 51%;
  --accent:       265 88% 78%;   /* #bd93f9 */
  --accent-foreground: 232 16% 14%;
  --destructive:  0   100% 67%;  /* #ff5555 */
  --success:      135  96% 63%;  /* #50fa7b */
  --warning:      62   95% 77%;  /* #f1fa8c */
  --info:         193  93% 77%;  /* #8be9fd */
}
```

## Regras de estilo

### Nunca escreva cores literais em JSX
```tsx
// ✅
<div className="bg-surface border border-border text-foreground" />
<span className="text-accent" />
<p className="text-muted-foreground" />

// ❌ — nunca
<div style={{ background: "#282a36" }} />
<div className="bg-[#282a36]" />
<div className="text-[#bd93f9]" />
```

### Nunca concatene classes — use `cn()`
```tsx
import { cn } from "@/lib/utils"

// ✅
<button className={cn(
  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
  isActive ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground hover:text-foreground",
  className,
)} />

// ❌
<button className={"px-4 py-2 " + (isActive ? "bg-accent" : "bg-surface")} />
```

### Opacity via Tailwind — não rgba()
```tsx
// ✅
<div className="bg-accent/10 border-accent/20 text-accent" />

// ❌
<div style={{ background: "rgba(189, 147, 249, 0.1)" }} />
```

### Variantes de ícone — tamanho padrão
```tsx
// Sempre especifique h e w com Tailwind
<Monitor className="h-4 w-4" />          // ícone em linha com texto sm
<Activity className="h-5 w-5" />         // ícone destacado
<Settings className="h-4 w-4 text-muted-foreground" />  // ícone decorativo
```

## Badges de eventos — padrão fixo

Eventos da API têm tipos predefinidos. Use sempre as mesmas classes:

```tsx
const EVENT_CLASSES = {
  VOICE_JOIN:     "bg-info/10 text-info border-info/20",
  VOICE_LEAVE:    "bg-info/10 text-info border-info/20",
  VOICE_SWITCH:   "bg-info/10 text-info border-info/20",
  MESSAGE_SENT:   "bg-success/10 text-success border-success/20",
  MESSAGE_EDIT:   "bg-warning/10 text-warning border-warning/20",
  MESSAGE_DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  MENTION:        "bg-accent/10 text-accent border-accent/20",
} as const
```

### Exceção rara para `style={{}}`
Use `style` apenas para valores realmente dinâmicos de runtime que não podem ser representados por token ou classe fixa, como largura percentual de progress bar:

```tsx
<div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
</div>
```

## Badge de plano — padrão fixo

```tsx
const PLAN_CLASSES = {
  freemium: "bg-muted/20 text-muted-foreground border-muted/30",
  premium:  "bg-warning/10 text-warning border-warning/20",
  admin:    "bg-accent/10 text-accent border-accent/20",
} as const
```

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

## Tipografia

- Fonte principal: `Inter` (ou `system-ui` como fallback)
- `font-mono` exclusivamente para valores técnicos: timestamps, IDs, tokens
- Não use `font-mono` em texto de navegação, labels ou títulos de seção

## Proibido

- `style={{}}` para cor, layout estático ou valores que possam ser expressos por classes/tokens Tailwind
- Valores arbitrários de cor `text-[#...]` ou `bg-[#...]`
- Gradientes inline (`background: linear-gradient(...)`)
- Efeitos de brilho/glow (box-shadow coloridos em componentes de negócio)
- Emoji de caractere Unicode (use ícones Lucide)
- `!important` em Tailwind (`!text-red-500`) — refatore a especificidade
