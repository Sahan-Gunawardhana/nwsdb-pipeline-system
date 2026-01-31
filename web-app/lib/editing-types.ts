// Enhanced types for geographic feature editing
// These extend existing types without breaking mobile app compatibility

export enum EditMode {
  VIEW = 'view',
  CREATE = 'create', 
  EDIT = 'edit',
  DELETE = 'delete'
}

export enum GeometryValidationError {
  INSUFFICIENT_VERTICES = 'insufficient_vertices',
  SELF_INTERSECTION = 'self_intersection', 
  INVALID_COORDINATES = 'invalid_coordinates',
  TOPOLOGY_ERROR = 'topology_error'
}

export interface ValidationResult {
  isValid: boolean
  errors: GeometryValidationError[]
  warnings: string[]
}

export interface VertexHandle {
  id: string
  position: [number, number] // [lat, lng]
  index: number
  isDragging: boolean
}

export interface EditableGeometry {
  type: string
  coordinates: number[][] | number[][][]
  editingVertices?: VertexHandle[]
  isValid?: boolean
  validationErrors?: string[]
}

export interface EditState {
  mode: EditMode
  selectedFeatureId: string | null
  selectedFeatureType: 'pipeline' | 'zone' | 'marker' | null
  editingGeometry: any | null
  isDirty: boolean
  isAutoSaving: boolean
  lastSaved: Date | null
}

export interface AutoSaveConfig {
  debounceDelay: number // 2000ms default
  maxRetries: number // 3 attempts  
  retryDelay: number // 1000ms between retries
  enableOfflineQueue: boolean
}

export interface PendingSave {
  featureId: string
  featureType: 'pipeline' | 'zone' | 'marker'
  geometry: any
  timestamp: Date
  retryCount: number
}

// Extended interfaces that maintain compatibility with existing mobile app
export interface EditableFeatureData {
  id?: string
  geometry: any // Maintains existing format
  isEditing?: boolean
  isDirty?: boolean
  lastEditedAt?: Date
  editVersion?: number
}