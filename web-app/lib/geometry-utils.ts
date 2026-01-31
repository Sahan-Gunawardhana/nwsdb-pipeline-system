import { GeometryValidationError, ValidationResult, VertexHandle } from './editing-types'

/**
 * Geometry processing utilities for geographic feature editing
 * Maintains compatibility with existing Firebase data structure
 */

export class GeometryValidator {
  /**
   * Validates polygon geometry ensuring minimum vertices and no self-intersections
   */
  static validatePolygon(geometry: any): ValidationResult {
    const errors: GeometryValidationError[] = []
    const warnings: string[] = []

    if (!geometry || !geometry.coordinates || !geometry.coordinates[0]) {
      errors.push(GeometryValidationError.INVALID_COORDINATES)
      return { isValid: false, errors, warnings }
    }

    const coordinates = geometry.coordinates[0]
    
    // Check minimum vertices (3 for polygon)
    if (coordinates.length < 4) { // 4 because first and last should be same
      errors.push(GeometryValidationError.INSUFFICIENT_VERTICES)
    }

    // Check if polygon is closed
    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]
    if (first[0] !== last[0] || first[1] !== last[1]) {
      warnings.push('Polygon is not closed - will be auto-closed')
    }

    // Basic self-intersection check
    if (this.hasSelfIntersection(coordinates)) {
      errors.push(GeometryValidationError.SELF_INTERSECTION)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates polyline geometry
   */
  static validatePolyline(geometry: any): ValidationResult {
    const errors: GeometryValidationError[] = []
    const warnings: string[] = []

    if (!geometry || !geometry.coordinates) {
      errors.push(GeometryValidationError.INVALID_COORDINATES)
      return { isValid: false, errors, warnings }
    }

    const coordinates = geometry.coordinates
    
    // Check minimum vertices (2 for line)
    if (coordinates.length < 2) {
      errors.push(GeometryValidationError.INSUFFICIENT_VERTICES)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validates point geometry
   */
  static validatePoint(geometry: any): ValidationResult {
    const errors: GeometryValidationError[] = []
    const warnings: string[] = []

    if (!geometry || !geometry.coordinates || geometry.coordinates.length !== 2) {
      errors.push(GeometryValidationError.INVALID_COORDINATES)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Simple self-intersection detection for polygons
   */
  private static hasSelfIntersection(coordinates: number[][]): boolean {
    // Simplified check - in production, use a proper computational geometry library
    for (let i = 0; i < coordinates.length - 1; i++) {
      for (let j = i + 2; j < coordinates.length - 1; j++) {
        if (j === coordinates.length - 2 && i === 0) continue // Skip last-first edge
        
        if (this.linesIntersect(
          coordinates[i], coordinates[i + 1],
          coordinates[j], coordinates[j + 1]
        )) {
          return true
        }
      }
    }
    return false
  }

  /**
   * Check if two line segments intersect
   */
  private static linesIntersect(
    p1: number[], p2: number[], 
    p3: number[], p4: number[]
  ): boolean {
    const det = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p4[0] - p3[0]) * (p2[1] - p1[1])
    if (det === 0) return false // Parallel lines
    
    const lambda = ((p4[1] - p3[1]) * (p4[0] - p1[0]) + (p3[0] - p4[0]) * (p4[1] - p1[1])) / det
    const gamma = ((p1[1] - p2[1]) * (p4[0] - p1[0]) + (p2[0] - p1[0]) * (p4[1] - p1[1])) / det
    
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)
  }

  /**
   * Get user-friendly error message
   */
  static getErrorMessage(error: GeometryValidationError): string {
    switch (error) {
      case GeometryValidationError.INSUFFICIENT_VERTICES:
        return 'Polygon must have at least 3 vertices'
      case GeometryValidationError.SELF_INTERSECTION:
        return 'Polygon edges cannot cross each other'
      case GeometryValidationError.INVALID_COORDINATES:
        return 'Invalid coordinate data'
      case GeometryValidationError.TOPOLOGY_ERROR:
        return 'Geometry topology error'
      default:
        return 'Unknown geometry error'
    }
  }
}

/**
 * Coordinate transformation utilities
 */
export class CoordinateUtils {
  /**
   * Convert Leaflet LatLng to GeoJSON coordinate [lng, lat]
   */
  static leafletToGeoJSON(latLng: [number, number]): [number, number] {
    return [latLng[1], latLng[0]] // Swap lat,lng to lng,lat
  }

  /**
   * Convert GeoJSON coordinate [lng, lat] to Leaflet LatLng [lat, lng]
   */
  static geoJSONToLeaflet(coord: [number, number]): [number, number] {
    return [coord[1], coord[0]] // Swap lng,lat to lat,lng
  }

  /**
   * Convert array of Leaflet coordinates to GeoJSON format
   */
  static leafletArrayToGeoJSON(coords: [number, number][]): [number, number][] {
    return coords.map(coord => this.leafletToGeoJSON(coord))
  }

  /**
   * Convert array of GeoJSON coordinates to Leaflet format
   */
  static geoJSONArrayToLeaflet(coords: [number, number][]): [number, number][] {
    return coords.map(coord => this.geoJSONToLeaflet(coord))
  }

  /**
   * Ensure polygon is properly closed (first and last coordinates match)
   */
  static ensurePolygonClosed(coordinates: [number, number][]): [number, number][] {
    if (coordinates.length < 3) return coordinates
    
    const first = coordinates[0]
    const last = coordinates[coordinates.length - 1]
    
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return [...coordinates, first]
    }
    
    return coordinates
  }
}

/**
 * Vertex manipulation utilities
 */
export class VertexUtils {
  /**
   * Add a new vertex at the specified position in a polygon
   */
  static addVertex(
    coordinates: [number, number][], 
    newVertex: [number, number], 
    insertIndex: number
  ): [number, number][] {
    const newCoords = [...coordinates]
    newCoords.splice(insertIndex, 0, newVertex)
    return CoordinateUtils.ensurePolygonClosed(newCoords)
  }

  /**
   * Remove a vertex from a polygon (ensuring minimum 3 vertices)
   */
  static removeVertex(
    coordinates: [number, number][], 
    removeIndex: number
  ): [number, number][] {
    if (coordinates.length <= 4) { // 4 because polygon should be closed
      throw new Error('Cannot remove vertex: polygon must have at least 3 vertices')
    }

    const newCoords = coordinates.filter((_, index) => index !== removeIndex)
    return CoordinateUtils.ensurePolygonClosed(newCoords)
  }

  /**
   * Update vertex position in a polygon
   */
  static updateVertex(
    coordinates: [number, number][], 
    vertexIndex: number, 
    newPosition: [number, number]
  ): [number, number][] {
    const newCoords = [...coordinates]
    newCoords[vertexIndex] = newPosition
    
    // If updating first vertex, also update last vertex (for closed polygon)
    if (vertexIndex === 0 && newCoords.length > 1) {
      newCoords[newCoords.length - 1] = newPosition
    }
    // If updating last vertex, also update first vertex
    else if (vertexIndex === newCoords.length - 1 && newCoords.length > 1) {
      newCoords[0] = newPosition
    }
    
    return newCoords
  }

  /**
   * Generate vertex handles for editing
   */
  static generateVertexHandles(coordinates: [number, number][]): VertexHandle[] {
    // Don't include the last coordinate if it's the same as first (closed polygon)
    const uniqueCoords = coordinates.length > 1 && 
      coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
      coordinates[0][1] === coordinates[coordinates.length - 1][1]
      ? coordinates.slice(0, -1)
      : coordinates

    return uniqueCoords.map((coord, index) => ({
      id: `vertex-${index}`,
      position: CoordinateUtils.geoJSONToLeaflet(coord),
      index,
      isDragging: false
    }))
  }

  /**
   * Find the best insertion point for a new vertex on an edge
   */
  static findInsertionPoint(
    coordinates: [number, number][],
    clickPoint: [number, number]
  ): { insertIndex: number; position: [number, number] } {
    let minDistance = Infinity
    let bestIndex = 1
    let bestPosition = clickPoint

    for (let i = 0; i < coordinates.length - 1; i++) {
      const start = coordinates[i]
      const end = coordinates[i + 1]
      
      const projected = this.projectPointOnLine(clickPoint, start, end)
      const distance = this.calculateDistance(clickPoint, projected)
      
      if (distance < minDistance) {
        minDistance = distance
        bestIndex = i + 1
        bestPosition = projected
      }
    }

    return { insertIndex: bestIndex, position: bestPosition }
  }

  /**
   * Project a point onto a line segment
   */
  private static projectPointOnLine(
    point: [number, number],
    lineStart: [number, number], 
    lineEnd: [number, number]
  ): [number, number] {
    const dx = lineEnd[0] - lineStart[0]
    const dy = lineEnd[1] - lineStart[1]
    
    if (dx === 0 && dy === 0) return lineStart
    
    const t = Math.max(0, Math.min(1, 
      ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (dx * dx + dy * dy)
    ))
    
    return [
      lineStart[0] + t * dx,
      lineStart[1] + t * dy
    ]
  }

  /**
   * Calculate distance between two points
   */
  private static calculateDistance(
    point1: [number, number], 
    point2: [number, number]
  ): number {
    const dx = point2[0] - point1[0]
    const dy = point2[1] - point1[1]
    return Math.sqrt(dx * dx + dy * dy)
  }
}