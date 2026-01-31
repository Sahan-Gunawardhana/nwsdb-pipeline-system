"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, FeatureGroup, Polyline, Polygon, Marker, Popup, useMap } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { PipelineModal } from "./pipeline-modal"
import { ZoneModal } from "./zone-modal"
import { MarkerModal } from "./marker-modal"
import { VertexEditor } from "./vertex-editor"
import { ContextMenu, useContextMenu } from "./context-menu"
import { useAuth } from "@/lib/auth-context"
import { type PipelineData, type ZoneData, type MarkerData, getPipelines, getZones, getMarkers, deletePipeline, deleteZone, deleteMarker } from "@/lib/firestore"
import { EditMode } from "@/lib/editing-types"

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

interface MapComponentProps {
  onDataUpdate: () => void
}

function MapUpdater({
  pipelines,
  zones,
  markers,
}: { pipelines: PipelineData[]; zones: ZoneData[]; markers: MarkerData[] }) {
  const map = useMap()

  useEffect(() => {
    // Fit bounds to show all data
    if (pipelines.length > 0 || zones.length > 0 || markers.length > 0) {
      const group = new L.FeatureGroup()

      pipelines.forEach((pipeline) => {
        if (pipeline.geometry?.coordinates) {
          const polyline = L.polyline(pipeline.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]))
          group.addLayer(polyline)
        }
      })

      zones.forEach((zone) => {
        if (zone.geometry?.coordinates?.[0]) {
          const polygon = L.polygon(zone.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]))
          group.addLayer(polygon)
        }
      })

      markers.forEach((marker) => {
        if (marker.geometry?.coordinates) {
          const markerLayer = L.marker([marker.geometry.coordinates[1], marker.geometry.coordinates[0]])
          group.addLayer(markerLayer)
        }
      })

      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [20, 20] })
      }
    }
  }, [map, pipelines, zones, markers])

  return null
}

export function MapComponent({ onDataUpdate }: MapComponentProps) {
  const { user } = useAuth()
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [markerModalOpen, setMarkerModalOpen] = useState(false)
  const [currentGeometry, setCurrentGeometry] = useState<any>(null)
  const [pipelines, setPipelines] = useState<PipelineData[]>([])
  const [zones, setZones] = useState<ZoneData[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  
  // Enhanced editing state
  const [editMode, setEditMode] = useState<EditMode>(EditMode.VIEW)
  const [selectedFeature, setSelectedFeature] = useState<{
    id: string
    type: 'pipeline' | 'zone' | 'marker'
    data: PipelineData | ZoneData | MarkerData
  } | null>(null)
  const [editingGeometry, setEditingGeometry] = useState<any>(null)
  
  // Context menu state
  const {
    isOpen: contextMenuOpen,
    position: contextMenuPosition,
    feature: contextMenuFeature,
    featureType: contextMenuFeatureType,
    openContextMenu,
    closeContextMenu
  } = useContextMenu()

  const getRiskColor = (riskScore: number) => {
    // Green (0.0) to Red (0.9) gradient
    const red = Math.min(255, Math.floor(riskScore * 283))
    const green = Math.max(0, Math.floor(255 - riskScore * 283))
    return `rgb(${red}, ${green}, 0)`
  }

  const getZoneColor = (zone: ZoneData) => {
    // Calculate risk based on pipelines within zone
    const zonePipelines = pipelines.filter((pipeline) => {
      // Simple point-in-polygon check (simplified)
      return true // In production, implement proper spatial query
    })

    const highRiskCount = zonePipelines.filter((p) => p.riskScore > 0.6).length
    const totalCount = zonePipelines.length

    if (totalCount === 0) return "#94a3b8" // Gray for no pipelines

    const riskRatio = highRiskCount / totalCount
    return getRiskColor(riskRatio)
  }

  const loadData = async () => {
    if (!user) return

    try {
      const [pipelineData, zoneData, markerData] = await Promise.all([
        getPipelines(user.uid),
        getZones(user.uid),
        getMarkers(user.uid),
      ])

      setPipelines(pipelineData)
      setZones(zoneData)
      setMarkers(markerData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleCreated = (e: any) => {
    const { layer, layerType } = e
    const geometry = layer.toGeoJSON().geometry

    setCurrentGeometry(geometry)

    if (layerType === "polyline") {
      setPipelineModalOpen(true)
    } else if (layerType === "polygon") {
      setZoneModalOpen(true)
    } else if (layerType === "marker") {
      setMarkerModalOpen(true)
    }

    // Remove the temporary layer
    if (featureGroupRef.current) {
      featureGroupRef.current.removeLayer(layer)
    }
  }

  const handleModalClose = () => {
    setPipelineModalOpen(false)
    setZoneModalOpen(false)
    setMarkerModalOpen(false)
    setCurrentGeometry(null)
    loadData()
    onDataUpdate()
  }

  // Enhanced editing functions
  const handleFeatureSelect = (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker',
    featureData: PipelineData | ZoneData | MarkerData
  ) => {
    setSelectedFeature({
      id: featureId,
      type: featureType,
      data: featureData
    })
    setEditMode(EditMode.VIEW)
  }

  const handleStartEdit = (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker',
    featureData: PipelineData | ZoneData | MarkerData
  ) => {
    setSelectedFeature({
      id: featureId,
      type: featureType,
      data: featureData
    })
    setEditingGeometry(featureData.geometry)
    setEditMode(EditMode.EDIT)
  }

  const handleGeometryChange = (newGeometry: any) => {
    setEditingGeometry(newGeometry)
    
    // Update the feature data in state for real-time preview
    if (selectedFeature) {
      const updatedData = { ...selectedFeature.data, geometry: newGeometry }
      
      if (selectedFeature.type === 'pipeline') {
        setPipelines(prev => prev.map(p => 
          p.id === selectedFeature.id ? updatedData as PipelineData : p
        ))
      } else if (selectedFeature.type === 'zone') {
        setZones(prev => prev.map(z => 
          z.id === selectedFeature.id ? updatedData as ZoneData : z
        ))
      } else if (selectedFeature.type === 'marker') {
        setMarkers(prev => prev.map(m => 
          m.id === selectedFeature.id ? updatedData as MarkerData : m
        ))
      }
    }
  }

  const handleEditComplete = () => {
    setEditMode(EditMode.VIEW)
    setEditingGeometry(null)
    loadData() // Refresh from database
    onDataUpdate()
  }

  const handleEditCancel = () => {
    setEditMode(EditMode.VIEW)
    setEditingGeometry(null)
    setSelectedFeature(null)
    loadData() // Refresh to revert changes
  }

  const handleFeatureDelete = async (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker'
  ) => {
    if (!confirm(`Are you sure you want to delete this ${featureType}?`)) {
      return
    }

    try {
      if (featureType === 'pipeline') {
        await deletePipeline(featureId)
      } else if (featureType === 'zone') {
        await deleteZone(featureId)
      } else if (featureType === 'marker') {
        await deleteMarker(featureId)
      }

      // Clear selection if deleted feature was selected
      if (selectedFeature?.id === featureId) {
        setSelectedFeature(null)
        setEditMode(EditMode.VIEW)
      }

      loadData()
      onDataUpdate()
    } catch (error) {
      console.error('Error deleting feature:', error)
      alert('Failed to delete feature. Please try again.')
    }
  }

  const handleGeometryUpdate = async (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker',
    newGeometry: any
  ) => {
    try {
      // Update in Firebase using existing functions
      if (featureType === 'pipeline') {
        const { updatePipeline } = await import('@/lib/firestore')
        await updatePipeline(featureId, { geometry: newGeometry })
      } else if (featureType === 'zone') {
        const { updateZone } = await import('@/lib/firestore')
        await updateZone(featureId, { geometry: newGeometry })
      } else if (featureType === 'marker') {
        const { updateMarker } = await import('@/lib/firestore')
        await updateMarker(featureId, { geometry: newGeometry })
      }

      // Refresh data
      loadData()
      onDataUpdate()
    } catch (error) {
      console.error('Error updating geometry:', error)
      alert('Failed to save changes. Please try again.')
    }
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[6.9271, 79.8612]} // Colombo, Sri Lanka
        zoom={13}
        className="h-full w-full"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            draw={{
              rectangle: false,
              circle: false,
              circlemarker: false,
              polyline: {
                shapeOptions: {
                  color: "#3b82f6",
                  weight: 4,
                },
              },
              polygon: {
                shapeOptions: {
                  color: "#8b5cf6",
                  weight: 2,
                  fillOpacity: 0.3,
                },
              },
              marker: true,
            }}
          />
        </FeatureGroup>

        {/* Render existing pipelines */}
        {pipelines.map(
          (pipeline) =>
            pipeline.geometry?.coordinates && (
              <EditablePipeline
                key={pipeline.id}
                pipeline={pipeline}
                isSelected={selectedFeature?.id === pipeline.id}
                onSelect={() => handleFeatureSelect(pipeline.id!, 'pipeline', pipeline)}
                onEdit={(newGeometry) => handleGeometryUpdate(pipeline.id!, 'pipeline', newGeometry)}
                onDelete={() => handleFeatureDelete(pipeline.id!, 'pipeline')}
                getRiskColor={getRiskColor}
              />
            ),
        )}

        {/* Render existing zones */}
        {zones.map(
          (zone) =>
            zone.geometry?.coordinates?.[0] && (
              <EditableZone
                key={zone.id}
                zone={zone}
                isSelected={selectedFeature?.id === zone.id}
                onSelect={() => handleFeatureSelect(zone.id!, 'zone', zone)}
                onEdit={(newGeometry) => handleGeometryUpdate(zone.id!, 'zone', newGeometry)}
                onDelete={() => handleFeatureDelete(zone.id!, 'zone')}
                getZoneColor={getZoneColor}
              />
            ),
        )}

        {/* Render existing markers */}
        {markers.map(
          (marker) =>
            marker.geometry?.coordinates && (
              <EditableMarker
                key={marker.id}
                marker={marker}
                isSelected={selectedFeature?.id === marker.id}
                onSelect={() => handleFeatureSelect(marker.id!, 'marker', marker)}
                onEdit={(newGeometry) => handleGeometryUpdate(marker.id!, 'marker', newGeometry)}
                onDelete={() => handleFeatureDelete(marker.id!, 'marker')}
              />
            ),
        )}

        {/* Vertex Editor for selected feature */}
        {selectedFeature && editMode === EditMode.EDIT && (
          <VertexEditor
            featureId={selectedFeature.id}
            featureType={selectedFeature.type}
            geometry={editingGeometry || selectedFeature.data.geometry}
            isEditing={true}
            onGeometryChange={handleGeometryChange}
            onEditComplete={handleEditComplete}
            onEditCancel={handleEditCancel}
          />
        )}

        <MapUpdater pipelines={pipelines} zones={zones} markers={markers} />
      </MapContainer>

      {/* Zone name chips */}
      {zones.map((zone) => {
        if (!zone.geometry?.coordinates?.[0]) return null

        // Calculate centroid for chip placement
        const coords = zone.geometry.coordinates[0]
        const centroidLat = coords.reduce((sum: number, coord: number[]) => sum + coord[1], 0) / coords.length
        const centroidLng = coords.reduce((sum: number, coord: number[]) => sum + coord[0], 0) / coords.length

        return (
          <div
            key={`chip-${zone.id}`}
            className="absolute bg-white px-2 py-1 rounded-full shadow-md text-xs font-medium border pointer-events-none"
            style={{
              zIndex: 1000,
              transform: "translate(-50%, -50%)",
              // Note: In a real implementation, you'd convert lat/lng to pixel coordinates
            }}
          >
            {zone.name}
          </div>
        )
      })}

      {/* Modals */}
      <PipelineModal open={pipelineModalOpen} onClose={handleModalClose} geometry={currentGeometry} />

      <ZoneModal open={zoneModalOpen} onClose={handleModalClose} geometry={currentGeometry} />

      <MarkerModal open={markerModalOpen} onClose={handleModalClose} geometry={currentGeometry} />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenuOpen}
        position={contextMenuPosition}
        feature={contextMenuFeature}
        featureType={contextMenuFeatureType}
        onClose={closeContextMenu}
        onEdit={() => {
          if (contextMenuFeature && contextMenuFeatureType) {
            handleStartEdit(
              contextMenuFeature.id!,
              contextMenuFeatureType,
              contextMenuFeature
            )
          }
        }}
        onDelete={() => {
          if (contextMenuFeature && contextMenuFeatureType) {
            handleFeatureDelete(contextMenuFeature.id!, contextMenuFeatureType)
          }
        }}
      />
    </div>
  )
}

// Editable feature components using Leaflet's built-in editing
function EditablePipeline({ 
  pipeline, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  getRiskColor 
}: {
  pipeline: PipelineData
  isSelected: boolean
  onSelect: () => void
  onEdit: (geometry: any) => void
  onDelete: () => void
  getRiskColor: (score: number) => string
}) {
  const polylineRef = useRef<L.Polyline>(null)

  useEffect(() => {
    const polyline = polylineRef.current
    if (!polyline) return

    if (isSelected) {
      // Enable editing when selected
      if ((polyline as any).editing) {
        (polyline as any).editing.enable()
      }
    } else {
      // Disable editing when not selected
      if ((polyline as any).editing) {
        (polyline as any).editing.disable()
      }
    }
  }, [isSelected])

  return (
    <>
      <Polyline
        ref={polylineRef}
        positions={pipeline.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]])}
        color={getRiskColor(pipeline.riskScore)}
        weight={isSelected ? 6 : 4}
        opacity={isSelected ? 1 : 0.8}
        eventHandlers={{
          click: onSelect,
          'edit': (e) => {
            const layer = e.target
            const geometry = layer.toGeoJSON().geometry
            onEdit(geometry)
          },
          contextmenu: (e) => {
            e.originalEvent.preventDefault()
            if (confirm(`Delete pipeline "${pipeline.name}"?`)) {
              onDelete()
            }
          }
        }}
      >
        <Popup>
          <div className="p-2">
            <h3 className="font-semibold">{pipeline.name}</h3>
            <p><strong>From:</strong> {pipeline.startPosition}</p>
            <p><strong>To:</strong> {pipeline.endPosition}</p>
            <p><strong>Material:</strong> {pipeline.material}</p>
            <p><strong>Diameter:</strong> {pipeline.diameter}mm</p>
            <p><strong>Risk Score:</strong> {pipeline.riskScore.toFixed(2)}</p>
            {isSelected && (
              <div className="mt-2 text-xs text-blue-600">
                ✏️ Click and drag to edit • Right-click to delete
              </div>
            )}
          </div>
        </Popup>
      </Polyline>
      
      {/* Start point label */}
      {pipeline.geometry.coordinates[0] && (
        <Marker
          position={[pipeline.geometry.coordinates[0][1], pipeline.geometry.coordinates[0][0]]}
          icon={L.divIcon({
            className: 'start-point-marker',
            html: `<span class="text-xs font-medium text-green-700 whitespace-nowrap">${pipeline.startPosition}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 20]
          })}
        >
          <Popup>
            <div className="p-2 text-center">
              <p className="font-semibold text-green-700">Start Point</p>
              <p className="text-sm">{pipeline.startPosition}</p>
              <p className="text-xs text-gray-500">Pipeline: {pipeline.name}</p>
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* End point label */}
      {pipeline.geometry.coordinates[pipeline.geometry.coordinates.length - 1] && (
        <Marker
          position={[
            pipeline.geometry.coordinates[pipeline.geometry.coordinates.length - 1][1], 
            pipeline.geometry.coordinates[pipeline.geometry.coordinates.length - 1][0]
          ]}
          icon={L.divIcon({
            className: 'end-point-marker',
            html: `<span class="text-xs font-medium text-red-700 whitespace-nowrap">${pipeline.endPosition}</span>`,
            iconSize: [0, 0],
            iconAnchor: [0, 20]
          })}
        >
          <Popup>
            <div className="p-2 text-center">
              <p className="font-semibold text-red-700">End Point</p>
              <p className="text-sm">{pipeline.endPosition}</p>
              <p className="text-xs text-gray-500">Pipeline: {pipeline.name}</p>
            </div>
          </Popup>
        </Marker>
      )}
    </>
  )
}

function EditableZone({ 
  zone, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete, 
  getZoneColor 
}: {
  zone: ZoneData
  isSelected: boolean
  onSelect: () => void
  onEdit: (geometry: any) => void
  onDelete: () => void
  getZoneColor: (zone: ZoneData) => string
}) {
  const polygonRef = useRef<L.Polygon>(null)

  useEffect(() => {
    const polygon = polygonRef.current
    if (!polygon) return

    if (isSelected) {
      // Enable editing when selected
      if ((polygon as any).editing) {
        (polygon as any).editing.enable()
      }
    } else {
      // Disable editing when not selected
      if ((polygon as any).editing) {
        (polygon as any).editing.disable()
      }
    }
  }, [isSelected])

  return (
    <Polygon
      ref={polygonRef}
      positions={zone.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])}
      color={getZoneColor(zone)}
      weight={isSelected ? 4 : 2}
      fillOpacity={isSelected ? 0.5 : 0.3}
      eventHandlers={{
        click: onSelect,
        'edit': (e) => {
          const layer = e.target
          const geometry = layer.toGeoJSON().geometry
          onEdit(geometry)
        },
        contextmenu: (e) => {
          e.originalEvent.preventDefault()
          if (confirm(`Delete zone "${zone.name}"?`)) {
            onDelete()
          }
        }
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-semibold">{zone.name}</h3>
          <p><strong>Population:</strong> {zone.population}</p>
          <p><strong>Houses:</strong> {zone.houses}</p>
          <p><strong>Area:</strong> {zone.squareKilometers} km²</p>
          {isSelected && (
            <div className="mt-2 text-xs text-purple-600">
              ✏️ Drag vertices to edit • Right-click to delete
            </div>
          )}
        </div>
      </Popup>
    </Polygon>
  )
}

function EditableMarker({ 
  marker, 
  isSelected, 
  onSelect, 
  onEdit, 
  onDelete 
}: {
  marker: MarkerData
  isSelected: boolean
  onSelect: () => void
  onEdit: (geometry: any) => void
  onDelete: () => void
}) {
  const markerRef = useRef<L.Marker>(null)

  useEffect(() => {
    const markerLayer = markerRef.current
    if (!markerLayer) return

    if (isSelected) {
      // Enable dragging when selected
      markerLayer.dragging?.enable()
    } else {
      // Disable dragging when not selected
      markerLayer.dragging?.disable()
    }
  }, [isSelected])

  return (
    <Marker
      ref={markerRef}
      position={[marker.geometry.coordinates[1], marker.geometry.coordinates[0]]}
      draggable={isSelected}
      eventHandlers={{
        click: onSelect,
        dragend: (e) => {
          const markerLayer = e.target
          const position = markerLayer.getLatLng()
          const geometry = {
            type: 'Point',
            coordinates: [position.lng, position.lat]
          }
          onEdit(geometry)
        },
        contextmenu: (e) => {
          e.originalEvent.preventDefault()
          if (confirm(`Delete marker "${marker.name}"?`)) {
            onDelete()
          }
        }
      }}
    >
      <Popup>
        <div className="p-2">
          <h3 className="font-semibold">{marker.name}</h3>
          <p>{marker.description}</p>
          {isSelected && (
            <div className="mt-2 text-xs text-green-600">
              ✏️ Drag to move • Right-click to delete
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

// Add default export for dynamic import
export default MapComponent
