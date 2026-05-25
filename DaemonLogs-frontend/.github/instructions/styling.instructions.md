---
description: "Use when: estilizar componente, adicionar classe Tailwind, definir cor, criar variante visual, configurar tema, trabalhar em src/**/*.tsx, src/**/*.css, tailwind.config.ts."
applyTo: "src/**/*.tsx,src/**/*.css,tailwind.config.ts"
---

# Estilo e Tema

## Tokens de cor — Dracula (toned down)

O tema é inspirado no Dracula, com menos saturação e sem efeitos de brilho. As cores são definidas como variáveis CSS no `globals.css` e expostas pelo `tailwind.config.ts`:

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
/* globals.css — variáveis HSL para shadcn/ui */
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
  voice_join:     "bg-info/10 text-info border-info/20",
  voice_leave:    "bg-info/10 text-info border-info/20",
  voice_move:     "bg-info/10 text-info border-info/20",
  message_edit:   "bg-warning/10 text-warning border-warning/20",
  message_delete: "bg-destructive/10 text-destructive border-destructive/20",
  mention:        "bg-accent/10 text-accent border-accent/20",
} as const
```

## Badge de plano — padrão fixo

```tsx
const PLAN_CLASSES = {
  freemium: "bg-muted/20 text-muted-foreground border-muted/30",
  premium:  "bg-warning/10 text-warning border-warning/20",
  admin:    "bg-accent/10 text-accent border-accent/20",
} as const
```

## Layout base

- Sidebar: `w-60` fixa, scroll interno
- Conteúdo: `flex-1 min-w-0`, scroll no `<main>`
- Cards de estatísticas: `grid grid-cols-4 gap-4`
- Tabela de eventos: `col-span-2` + painel lateral `col-span-1`

## Tipografia

- Fonte principal: `Inter` (ou `system-ui` como fallback)
- `font-mono` exclusivamente para valores técnicos: timestamps, IDs, tokens
- Não use `font-mono` em texto de navegação, labels ou títulos de seção

## Proibido

- `style={{}}` para qualquer propriedade que o Tailwind suporte
- Valores arbitrários de cor `text-[#...]` ou `bg-[#...]`
- Gradientes inline (`background: linear-gradient(...)`)
- Efeitos de brilho/glow (box-shadow coloridos em componentes de negócio)
- Emoji de caractere Unicode (use ícones Lucide)
- `!important` em Tailwind (`!text-red-500`) — refatore a especificidade
