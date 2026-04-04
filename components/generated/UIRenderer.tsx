import { componentRegistry } from '@/lib/registry/component-registry'
import { uiPlanSchema } from '@/lib/schemas/ui-plan'
import type { UIPlan, UIPlanComponent } from '@/lib/schemas/ui-plan'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface UIPlanRendererProps {
  plan: unknown
}

function ComponentSlot({ item }: { item: UIPlanComponent }) {
  const entry = componentRegistry.get(item.type)

  if (!entry) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unknown Component</AlertTitle>
        <AlertDescription>
          Component &quot;{item.type}&quot; is not registered.
        </AlertDescription>
      </Alert>
    )
  }

  const Component = entry.component as React.ComponentType<Record<string, unknown>>

  // Spread action params as props so components can receive pre-resolved params if needed.
  const props: Record<string, unknown> = {
    title: item.title,
    ...(item.action?.params ?? {}),
  }

  return <Component {...props} />
}

/** Validates and renders a UI plan returned by the chat endpoint. */
export function UIRenderer({ plan }: UIPlanRendererProps) {
  const result = uiPlanSchema.safeParse(plan)

  if (!result.success) {
    console.error('UI plan validation failed:', result.error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Invalid UI Plan</AlertTitle>
        <AlertDescription>
          The plan returned by the server failed schema validation and cannot be rendered.
        </AlertDescription>
      </Alert>
    )
  }

  const validPlan = result.data as UIPlan
  const sorted = [...validPlan.components].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-4">
      {sorted.map((item, idx) => (
        <ComponentSlot key={`${item.type}-${idx}`} item={item} />
      ))}
    </div>
  )
}
