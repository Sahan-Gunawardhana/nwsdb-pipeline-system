"use client"

import { useEffect, useState, useCallback } from "react"
import { Marker, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { VertexHandle, EditableGeometry } from "@/lib/editing-types"
import { VertexUtils, CoordinateUtils, GeometryValidator } from "@/lib/geometry-utils"
import { useAutoSave } from "@/lib/auto-save"

// Custom vertex marker icon
const createVertexIcon = (isDragging: boolean = false) => {
  return L.divIcon({
    className: `vertex-handle ${isDragging ? 'dragging' : ''}`,
    html: `<div class="vertex-marker ${isDragging ? 'dragging' : ''}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

// Custom edge marker icon for adding vertices
const createEdgeIcon = () => {
  return L.divIcon({
    className: 'edge-handle',
    html: '<div class="edge-marker">+</div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })
}

interface VertexEditorProps {
  featureId: string
  featureType: 'pipeline' | 'zone' | 'marker'
  geometry: any
  isEditing: boolean
  onGeometryChange: (newGeometry: any) => void
  onEditComplete: () => void
  onEditCancel: () => void
}

export function VertexEditor({
  featureId,
  featureType,
  geometry,
  isEditing,
  onGeometryChange,
  onEditComplete,
  onEditCancel
}: VertexEditorProps) {
  const [vertexHandles, setVertexHandles] = useState<VertexHandle[]>([])
  const [draggedVertex, setDraggedVertex] = useState<string | null>(null)
  const [showEdgeHandles, setShowEdgeHandles] = useState(false)
  const { queueSave } = useAutoSave()

  // Extract coordinates based on geometry type
  const getCoordinates = useCallback(() => {
    if (!geometry) return []
    
    if (featureType === 'zone' && geometry.coordinates?.[0]) {
      return geometry.coordinates[0] // Polygon exterior ring
    } else if (featureType === 'pipeline' && geometry.coordinates) {
      return geometry.coordinates // LineString
    }
    return []
  }, [geometry, featureType])

  // Update vertex handles when geometry changes
  useEffect(() => {
    if (!isEditing) {
      setVertexHandles([])
      return
    }

    const coordinates = getCoordinates()
    if (coordinates.length > 0) {
      const handles = VertexUtils.generateVertexHandles(coordinates)
      setVertexHandles(handles)
    }
  }, [geometry, isEditing, getCoordinates])

  // Handle vertex drag start
  const handleVertexDragStart = useCallback((vertexId: string) => {
    setDraggedVertex(vertexId)
    setVertexHandles(prev => 
      prev.map(handle => 
        handle.id === vertexId 
          ? { ...handle, isDragging: true }
          : handle
      )
    )
  }, [])

  // Handle vertex drag
  const handleVertexDrag = useCallback((vertexId: string, newPosition: [number, number]) => {
    const vertexIndex = vertexHandles.find(h => h.id === vertexId)?.index
    if (vertexIndex === undefined) return

    const coordinates = getCoordinates()
    const geoJSONPosition = CoordinateUtils.leafletToGeoJSON(newPosition)
    
    try {
      const updatedCoords = VertexUtils.updateVertex(coordinates, vertexIndex, geoJSONPosition)
      
      // Create updated geometry
      let updatedGeometry
      if (featureType === 'zone') {
        updatedGeometry = {
          ...geometry,
          coordinates: [updatedCoords]
        }
      } else if (featureType === 'pipeline') {
        updatedGeometry = {
          ...geometry,
          coordinates: updatedCoords
        }
      }

      // Validate geometry
      const validation = featureType === 'zone' 
        ? GeometryValidator.validatePolygon(updatedGeometry)
        : GeometryValidator.validatePolyline(updatedGeometry)

      if (validation.isValid) {
        onGeometryChange(updatedGeometry)
      }
    } catch (error) {
      console.error('Error updating vertex:', error)
    }
  }, [vertexHandles, getCoordinates, geometry, featureType, onGeometryChange])

  // Handle vertex drag end
  const handleVertexDragEnd = useCallback((vertexId: string) => {
    setDraggedVertex(null)
    setVertexHandles(prev => 
      prev.map(handle => 
        handle.id === vertexId 
          ? { ...handle, isDragging: false }
          : handle
      )
    )

    // Queue auto-save
    queueSave(featureId, featureType, geometry)
  }, [featureId, featureType, geometry, queueSave])

  // Handle adding new vertex
  const handleAddVertex = useCallback((clickPosition: [number, number]) => {
    const coordinates = getCoordinates()
    const geoJSONPosition = CoordinateUtils.leafletToGeoJSON(clickPosition)
    
    try {
      const { insertIndex, position } = VertexUtils.findInsertionPoint(coordinates, geoJSONPosition)
      const updatedCoords = VertexUtils.addVertex(coordinates, position, insertIndex)
      
      // Create updated geometry
      let updatedGeometry
      if (featureType === 'zone') {
        updatedGeometry = {
          ...geometry,
          coordinates: [updatedCoords]
        }
      } else if (featureType === 'pipeline') {
        updatedGeometry = {
          ...geometry,
          coordinates: updatedCoords
        }
      }

      onGeometryChange(updatedGeometry)
      queueSave(featureId, featureType, updatedGeometry)
    } catch (error) {
      console.error('Error adding vertex:', error)
    }
  }, [getCoordinates, geometry, featureType, onGeometryChange, featureId, queueSave])

  // Handle removing vertex
  const handleRemoveVertex = useCallback((vertexIndex: number) => {
    const coordinates = getCoordinates()
    
    try {
      const updatedCoords = VertexUtils.removeVertex(coordinates, vertexIndex)
      
      // Create updated geometry
      let updatedGeometry
      if (featureType === 'zone') {
        updatedGeometry = {
          ...geometry,
          coordinates: [updatedCoords]
        }
      } else if (featureType === 'pipeline') {
        updatedGeometry = {
          ...geometry,
          coordinates: updatedCoords
        }
      }

      onGeometryChange(updatedGeometry)
      queueSave(featureId, featureType, updatedGeometry)
    } catch (error) {
      console.error('Error removing vertex:', error)
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Cannot remove vertex')
    }
  }, [getCoordinates, geometry, featureType, onGeometryChange, featureId, queueSave])

  // Map event handlers
  useMapEvents({
    dblclick: (e) => {
      if (isEditing && showEdgeHandles) {
        handleAddVertex([e.latlng.lat, e.latlng.lng])
      }
    },
    keydown: (e) => {
      if (e.originalEvent.key === 'Escape') {
        onEditCancel()
      } else if (e.originalEvent.key === 'Enter') {
        onEditComplete()
      }
    }
  })

  if (!isEditing) return null

  return (
    <>
      {/* Vertex handles */}
      {vertexHandles.map((handle) => (
        <VertexMarker
          key={handle.id}
          handle={handle}
          onDragStart={() => handleVertexDragStart(handle.id)}
          onDrag={(position) => handleVertexDrag(handle.id, position)}
          onDragEnd={() => handleVertexDragEnd(handle.id)}
          onRemove={() => handleRemoveVertex(handle.index)}
        />
      ))}

      {/* Edge handles for adding vertices (shown on hover) */}
      {showEdgeHandles && (
        <EdgeHandles
          coordinates={getCoordinates()}
          onAddVertex={handleAddVertex}
        />
      )}

      {/* CSS styles for vertex markers */}
      <style jsx global>{`
        .vertex-handle {
          background: transparent;
          border: none;
        }
        
        .vertex-marker {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        
        .vertex-marker:hover {
          background: #2563eb;
          transform: scale(1.2);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .vertex-marker.dragging {
          cursor: grabbing;
          background: #1d4ed8;
          transform: scale(1.3);
          box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        }
        
        .edge-handle {
          background: transparent;
          border: none;
        }
        
        .edge-marker {
          width: 16px;
          height: 16px;
          background: #10b981;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          color: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s ease;
        }
        
        .edge-marker:hover {
          background: #059669;
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
      `}</style>
    </>
  )
}

// Individual vertex marker component
interface VertexMarkerProps {
  handle: VertexHandle
  onDragStart: () => void
  onDrag: (position: [number, number]) => void
  onDragEnd: () => void
  onRemove: () => void
}

function VertexMarker({ handle, onDragStart, onDrag, onDragEnd, onRemove }: VertexMarkerProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <Marker
      position={handle.position}
      icon={createVertexIcon(handle.isDragging)}
      draggable={true}
      eventHandlers={{
        dragstart: () => {
          setIsDragging(true)
          onDragStart()
        },
        drag: (e) => {
          const marker = e.target
          const position = marker.getLatLng()
          onDrag([position.lat, position.lng])
        },
        dragend: () => {
          setIsDragging(false)
          onDragEnd()
        },
        contextmenu: (e) => {
          e.originalEvent.preventDefault()
          if (confirm('Remove this vertex?')) {
            onRemove()
          }
        }
      }}
    />
  )
}

// Edge handles component for adding vertices
interface EdgeHandlesProps {
  coordinates: [number, number][]
  onAddVertex: (position: [number, number]) => void
}

function EdgeHandles({ coordinates, onAddVertex }: EdgeHandlesProps) {
  if (coordinates.length < 2) return null

  const edgePoints: [number, number][] = []
  
  // Calculate midpoints of each edge
  for (let i = 0; i < coordinates.length - 1; i++) {
    const start = CoordinateUtils.geoJSONToLeaflet(coordinates[i])
    const end = CoordinateUtils.geoJSONToLeaflet(coordinates[i + 1])
    
    const midpoint: [number, number] = [
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2
    ]
    
    edgePoints.push(midpoint)
  }

  return (
    <>
      {edgePoints.map((point, index) => (
        <Marker
          key={`edge-${index}`}
          position={point}
          icon={createEdgeIcon()}
          eventHandlers={{
            click: () => onAddVertex(point)
          }}
        />
      ))}
    </>
  )
}