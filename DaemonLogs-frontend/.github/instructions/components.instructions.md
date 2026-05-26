---
description: "Use when: criar componente React, editar componente, reestruturar UI, criar master-detail, criar dialog, criar card, criar form, criar tabela, criar badge, criar botão, trabalhar em src/components/**."
applyTo: "src/components/**"
---

# Convenções de Componentes

## Regra de ouro: busque antes de criar

Antes de qualquer componente novo, verifique se já existe em:
- `src/components/ui/` — shadcn/ui (Button, Card, Dialog, Badge, Input, Select, Table, Tabs, Tooltip, Alert, etc.)
- `src/components/shared/` — componentes de negócio reutilizáveis
- Documentação shadcn: https://ui.shadcn.com/docs/components

## Estrutura de arquivo

```tsx
// src/components/events/EventBadge.tsx

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventType } from "@/types"

interface EventBadgeProps {
  type: EventType
  className?: string
}

const EVENT_VARIANT: Record<EventBadgeProps["type"], string> = {
  VOICE_JOIN:     "bg-info/10 text-info border-info/20",
  VOICE_LEAVE:    "bg-info/10 text-info border-info/20",
  VOICE_SWITCH:   "bg-info/10 text-info border-info/20",
  MESSAGE_SENT:   "bg-success/10 text-success border-success/20",
  MESSAGE_EDIT:   "bg-warning/10 text-warning border-warning/20",
  MESSAGE_DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  MENTION:        "bg-accent/10 text-accent border-accent/20",
}

export function EventBadge({ type, className }: EventBadgeProps) {
  return (
    <Badge variant="outline" className={cn(
      "inline-flex items-center px-2 py-0.5 text-xs font-mono",
      EVENT_VARIANT[type],
      className
    )}>
      {type}
    </Badge>
  )
}
```

**Regras do exemplo acima:**
- Variantes em objeto constante, não em if/else inline
- `cn()` para compor classes condicionais
- `className` prop para extensibilidade
- Interface tipada separada
- Para enums vindos da API, use os valores reais do contrato (`VOICE_JOIN`, `VOICE_LEAVE`, `VOICE_SWITCH`, etc.), nunca versões inventadas em lowercase

## Padrões obrigatórios

### `cn()` sempre para classes dinâmicas
```tsx
// ✅
className={cn("base-class", isActive && "active-class", className)}

// ❌ — nunca concatene strings
className={"base-class " + (isActive ? "active-class " : "") + className}
className={`base-class ${isActive ? "active-class" : ""}`}
```

### Props de variante com `cva` (para componentes com múltiplos estados)
```tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const cardVariants = cva("rounded-lg border p-4", {
  variants: {
    variant: {
      default: "bg-surface border-border",
      highlight: "bg-surface border-accent/30",
    },
  },
  defaultVariants: { variant: "default" },
})
```

### shadcn/ui: sempre importe de `@/components/ui/`
```tsx
// ✅
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// ❌ — nunca reimplemente o que shadcn já tem
```

### Ícones: exclusivamente `lucide-react`
```tsx
import { Monitor, Target, MessageSquare, Activity, Settings, Trash2, Plus } from "lucide-react"

// ✅
<Monitor className="h-4 w-4 text-muted-foreground" />

// ❌ — sem emoji, sem SVG inline, sem outras libs de ícone
```

## Componentes para entidades navegáveis e listas densas

Em superfícies com volume alto, componha a UI em dois blocos claros: **resumo reutilizável** e **detalhe reutilizável**.

- Para listas operacionais, prefira `Table` ou linhas enxutas antes de grade de cards grandes.
- `Card` é ótimo para overview, CTA, métricas e detalhes isolados; não é a estrutura padrão para despejar relações profundas.
- O item da lista principal deve responder rapidamente: quem é, qual o estado atual e por que vale abrir o detalhe.
- Relações `1->N`, listas grandes e payloads técnicos ficam fora da linha principal.
- Quando o detalhe precisar de scroll próprio, use `ScrollArea` dentro da surface de detalhe.
- Em mobile, troque side panel por dialog/página dedicada; em desktop, preserve comparação entre lista e detalhe quando fizer sentido.

```tsx
import { Badge } from "@/components/ui/badge"
import type { Target } from "@/types"

interface TargetRowProps {
  target: Target
  onOpen: () => void
}

export function TargetRow({ target, onOpen }: TargetRowProps) {
  const label = target.username_global ?? target.username ?? target.discord_user_id

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{target.discord_user_id}</p>
      </div>

      <Badge variant="outline" className="text-[11px]">
        Detalhes
      </Badge>
    </button>
  )
}
```

### Metadados técnicos são secundários

- IDs, hashes, timestamps completos, tokens e campos operacionais usam `font-mono`, `text-[11px]` ou `text-xs`, sempre com contraste secundário.
- Conteúdo humano, status e métricas principais usam o primeiro plano visual.
- Nunca misture metadado técnico com CTA primária no mesmo bloco sem hierarquia visual.

## Componentes de negócio compartilhados

Crie em `src/components/shared/` quando o componente aparecer em 2+ módulos:

| Componente | Descrição |
|-----------|-----------|
| `StatusDot` | Indicador online/offline com pulse opcional |
| `PlanBadge` | Badge de plano (freemium / premium / admin) |
| `AsyncButton` | Botão com estado de loading para ações 202 |
| `CopyButton` | Copiar texto para clipboard |
| `EmptyState` | Estado vazio de listas |
| `ErrorAlert` | Exibição de erros da API |

## Naming

- Componentes: `PascalCase`
- Arquivos: `PascalCase.tsx`
- Hooks: `use` + substantivo (`useMonitoring`, `useEvents`)
- Nunca use `index.tsx` como componente principal — seja explícito
