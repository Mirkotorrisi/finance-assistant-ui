/**
 * Workspaces service – maps to the backend /api/workspaces endpoints (projects and their blueprints).
 */

import { get, post, put } from './http'
import type { Blueprint, BlueprintPreview, CategoryUsage, TemplateInfo, Workspace } from '@/lib/types/blueprint'

export const workspacesService = {
  /** GET /api/workspaces */
  list(): Promise<Workspace[]> {
    return get<Workspace[]>('/api/workspaces')
  },

  /** GET /api/workspaces/current – the project this browser works in */
  current(): Promise<Workspace> {
    return get<Workspace>('/api/workspaces/current')
  },

  /** POST /api/workspaces */
  create(name: string, blueprint: Blueprint, description?: string): Promise<Workspace> {
    return post<Workspace>('/api/workspaces', { name, description, blueprint })
  },

  /** GET /api/workspaces/:id/blueprint */
  getBlueprint(id: number): Promise<{ workspace_id: number; version: number; blueprint: Blueprint }> {
    return get(`/api/workspaces/${id}/blueprint`)
  },

  /** PUT /api/workspaces/:id/blueprint */
  putBlueprint(id: number, blueprint: Blueprint): Promise<{ workspace_id: number; version: number; blueprint: Blueprint }> {
    return put(`/api/workspaces/${id}/blueprint`, blueprint)
  },

  /** POST /api/workspaces/:id/blueprint/preview – nothing is saved */
  previewBlueprint(id: number, blueprint: Blueprint): Promise<BlueprintPreview> {
    return post<BlueprintPreview>(`/api/workspaces/${id}/blueprint/preview`, blueprint)
  },

  /** POST /api/blueprints/validate – the normalised document, or an ApiError saying what is wrong */
  validate(blueprint: unknown): Promise<{ valid: boolean; blueprint: Blueprint }> {
    return post('/api/blueprints/validate', blueprint)
  },

  /** GET /api/blueprint-templates */
  templates(locale: string): Promise<TemplateInfo[]> {
    return get<TemplateInfo[]>('/api/blueprint-templates', { locale })
  },

  /** GET /api/blueprint-templates/:key */
  template(key: string, locale: string): Promise<Blueprint> {
    return get<Blueprint>(`/api/blueprint-templates/${key}`, { locale })
  },

  /** GET /api/reports/category-usage – the category names the transactions use, and whether the blueprint knows them */
  categoryUsage(): Promise<CategoryUsage[]> {
    return get<CategoryUsage[]>('/api/reports/category-usage')
  },

  /** POST /api/transactions/remap-category */
  remapCategory(from: string, to: string): Promise<{ transactions_updated: number }> {
    return post('/api/transactions/remap-category', { from_category: from, to_category: to })
  },
}
