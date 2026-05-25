---
description: "Use when: criar componente React, editar componente, criar dialog, criar card, criar form, criar tabela, criar badge, criar botão, trabalhar em src/components/**."
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

import { cn } from "@/lib/utils"

interface EventBadgeProps {
  type: "voice_join" | "voice_leave" | "voice_move" | "message_edit" | "message_delete" | "mention"
  className?: string
}

const EVENT_VARIANT: Record<EventBadgeProps["type"], string> = {
  voice_join:     "bg-info/10 text-info border-info/20",
  voice_leave:    "bg-info/10 text-info border-info/20",
  voice_move:     "bg-info/10 text-info border-info/20",
  message_edit:   "bg-warning/10 text-warning border-warning/20",
  message_delete: "bg-destructive/10 text-destructive border-destructive/20",
  mention:        "bg-accent/10 text-accent border-accent/20",
}

export function EventBadge({ type, className }: EventBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border",
      EVENT_VARIANT[type],
      className
    )}>
      {type.replace("_", " ")}
    </span>
  )
}
```

**Regras do exemplo acima:**
- Variantes em objeto constante, não em if/else inline
- `cn()` para compor classes condicionais
- `className` prop para extensibilidade
- Interface tipada separada

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
