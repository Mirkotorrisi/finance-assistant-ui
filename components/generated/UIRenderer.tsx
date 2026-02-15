import { componentRegistry } from '@/lib/registry/component-registry'
import { UIContract } from '@/lib/schemas/generated-ui'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface UIRendererProps {
  contract: UIContract
}

export function UIRenderer({ contract }: UIRendererProps) {
  try {
    const componentKey = contract.componentKey

    const entry = componentRegistry.get(componentKey as never)

    if (!entry) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Unknown Component</AlertTitle>
          <AlertDescription>
            Component &quot;{componentKey}&quot; is not registered.
          </AlertDescription>
        </Alert>
      )
    }

    // Validate data against schema if available
    if (entry.dataSchema) {
      const validation = entry.dataSchema.safeParse(contract)
      if (!validation.success) {
        console.error('Schema validation failed:', validation.error)
        return (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid Data</AlertTitle>
            <AlertDescription>
              The data for component &quot;{componentKey}&quot; does not match the expected schema.
            </AlertDescription>
          </Alert>
        )
      }
    }

    const Component = entry.component

    return <Component contract={contract} />
  } catch (error) {
    console.error('Error rendering component:', error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Render Error</AlertTitle>
        <AlertDescription>
          Failed to render component. Check console for details.
        </AlertDescription>
      </Alert>
    )
  }
}
