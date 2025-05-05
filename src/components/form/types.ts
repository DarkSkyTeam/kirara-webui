export interface Schema {
  title?: string
  type: string
  properties: Record<string, {
    type: string
    title?: string
    description?: string
    default?: any
    enum?: any[]
    items?: Schema
    properties?: Record<string, Schema>
    required?: string[]
  }>
  required?: string[]
} 

export interface ModelInfo {
  id: string
  type: string
  ability: number
}