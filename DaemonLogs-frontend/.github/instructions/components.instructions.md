---
description: "Use when: criar componente de domínio, editar componente React, padronizar props e className, reutilizar shadcn/ui, escolher ícone Lucide, trabalhar em src/components/auth/**, src/components/events/**, src/components/layout/**, src/components/me/**, src/components/monitoring/**, src/components/payments/**, src/components/shared/**, src/components/targets/**, src/components/tools/**."
applyTo: "src/components/auth/**,src/components/events/**,src/components/layout/**,src/components/me/**,src/components/monitoring/**,src/components/payments/**,src/components/shared/**,src/components/targets/**,src/components/tools/**"
---

# Convenções de Componentes

## Regra de ouro: busque antes de criar

Antes de qualquer componente novo, verifique se já existe em:
- `src/components/ui/` — shadcn/ui (Button, Card, Dialog, Badge, Input, Select, Table, Tabs, Tooltip, Alert, etc.)
- `src/components/shared/` — componentes de negócio reutilizáveis
- Documentação shadcn: https://ui.shadcn.com/docs/components

## Padrões obrigatórios

- Use `cn()` para classes condicionais e exponha `className?` quando o componente precisar ser estendido.
- Para múltiplos estados visuais, prefira `cva`.
- Reutilize `@/components/ui/*`; não reimplemente primitives do shadcn/ui.
- Use apenas ícones de `lucide-react`.
- Componentes compartilhados de negócio ficam em `src/components/shared/` quando aparecem em 2+ módulos.
- Metadados técnicos usam hierarquia secundária: `font-mono`, texto menor e contraste mais baixo.

## Exemplo enxuto

```tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { EventType } from "@/types"

interface EventBadgeProps {
  type: EventType
  className?: string
}

const EVENT_VARIANT: Record<EventType, string> = {
  VOICE_JOIN: "bg-info/10 text-info border-info/20",
  VOICE_LEAVE: "bg-info/10 text-info border-info/20",
  VOICE_SWITCH: "bg-info/10 text-info border-info/20",
  MESSAGE_SENT: "bg-success/10 text-success border-success/20",
  MESSAGE_EDIT: "bg-warning/10 text-warning border-warning/20",
  MESSAGE_DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  MENTION: "bg-accent/10 text-accent border-accent/20",
}

export function EventBadge({ type, className }: EventBadgeProps) {
  return <Badge variant="outline" className={cn("text-xs", EVENT_VARIANT[type], className)}>{type}</Badge>
}
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
