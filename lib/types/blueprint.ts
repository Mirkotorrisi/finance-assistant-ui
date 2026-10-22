/** Mirrors finance-assistant-api/src/blueprint/schema.py (the API validates; the UI only displays and edits a few fields). */

export interface BlueprintCategory {
  key: string
  label: string
  description?: string
  examples?: string[]
  aliases?: string[]
  kind?: 'expense' | 'income'
  attributes?: Record<string, unknown>
  children?: BlueprintCategory[]
}

export interface BlueprintGroup {
  key: string
  label: string
  description?: string
  members: string[]
}

export interface BlueprintDimension {
  key: string
  label: string
  description?: string
  values: { key: string; label: string }[]
}

export interface Blueprint {
  schema_version?: number
  name: string
  description?: string
  currency?: string
  instructions?: string
  categories?: BlueprintCategory[]
  groups?: BlueprintGroup[]
  dimensions?: BlueprintDimension[]
  reports?: { key: string; label: string; group?: string | null; categories?: string[] }[]
  rules?: { pattern: string; category: string }[]
  settings?: { detect_transfers?: boolean }
}

export interface Workspace {
  id: number
  name: string
  description: string | null
  owner_user_id: string | null
  blueprint_version: number
}

export interface BlueprintPreview {
  workspace_id: number
  current_version: number
  diff: {
    is_empty: boolean
    name_changed: boolean
    instructions_changed: boolean
    categories: {
      added: { key: string; label: string }[]
      removed: { key: string; label: string }[]
      renamed: { key: string; from: string; to: string }[]
      moved: { key: string; from: string | null; to: string | null }[]
    }
    groups: { added: string[]; removed: string[]; changed: string[] }
  }
  impact: {
    affected_transactions: number
    by_category: { key: string; label: string; transactions: number; texts: string[] }[]
  }
}

export interface TemplateInfo {
  key: string
  name: string
  description: string
}

export interface CategoryUsage {
  category: string
  /** The blueprint category it maps to, or null when the blueprint does not know the name. */
  key: string | null
  transactions: number
  net_amount: number
}
