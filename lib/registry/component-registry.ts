import { ComponentType } from 'react'

export type ComponentKey = 'summary-table' | 'basic-chart' | 'stock-quote' | 'portfolio' | 'market-data' | 'metric-card'

export interface ComponentRegistryEntry {
  key: ComponentKey
  component: ComponentType<{ contract?: unknown; data?: unknown }>
  description: string
  dataSchema?: {
    safeParse: (data: unknown) => { success: boolean; error?: unknown }
  }
}

export class ComponentRegistry {
  private registry: Map<ComponentKey, ComponentRegistryEntry>
  
  constructor() {
    this.registry = new Map()
  }
  
  register(entry: ComponentRegistryEntry): void {
    this.registry.set(entry.key, entry)
  }
  
  get(key: ComponentKey): ComponentRegistryEntry | undefined {
    return this.registry.get(key)
  }
  
  has(key: ComponentKey): boolean {
    return this.registry.has(key)
  }
  
  getAll(): ComponentRegistryEntry[] {
    return Array.from(this.registry.values())
  }
}

// Export singleton instance
export const componentRegistry = new ComponentRegistry()
