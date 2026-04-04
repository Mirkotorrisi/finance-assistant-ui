import { ComponentType } from 'react'

export type ComponentKey =
  | 'SummaryCards'
  | 'TransactionsTable'
  | 'AccountsList'
  | 'SpendingPie'
  | 'MonthlyBarChart'
  | 'FormTransaction'
  | 'FormAccount'

export interface ComponentRegistryEntry<TProps = unknown> {
  key: ComponentKey
  component: ComponentType<TProps>
  description: string
}

export class ComponentRegistry {
  private registry: Map<ComponentKey, ComponentRegistryEntry>

  constructor() {
    this.registry = new Map()
  }

  register<TProps>(entry: ComponentRegistryEntry<TProps>): void {
    this.registry.set(entry.key, entry as ComponentRegistryEntry)
  }

  get(key: string): ComponentRegistryEntry | undefined {
    return this.registry.get(key as ComponentKey)
  }

  has(key: string): boolean {
    return this.registry.has(key as ComponentKey)
  }

  getAll(): ComponentRegistryEntry[] {
    return Array.from(this.registry.values())
  }
}

// Export singleton instance
export const componentRegistry = new ComponentRegistry()
