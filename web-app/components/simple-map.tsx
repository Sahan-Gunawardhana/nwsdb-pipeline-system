"use client"

import { useEffect, useRef, useState } from "react"
import { MapContainer, TileLayer, FeatureGroup, Polyline, Polygon, Marker, Popup, Tooltip, useMap } from "react-leaflet"
import { EditControl } from "react-leaflet-draw"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-draw/dist/leaflet.draw.css"
import { PipelineModal } from "./pipeline-modal"
import { ZoneModal } from "./zone-modal"
import { MarkerModal } from "./marker-modal"
import { useAuth } from "@/lib/auth-context"
import { type PipelineData, type ZoneData, type MarkerData, getPipelines, getZones, getMarkers, updatePipeline, updateZone, updateMarker } from "@/lib/firestore"

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Helper function to calculate polygon centroid
const getPolygonCentroid = (coordinates: number[][]) => {
  if (!coordinates || coordinates.length === 0) return [0, 0]
  
  let x = 0
  let y = 0
  let count = 0
  
  coordinates.forEach(coord => {
    x += coord[0]
    y += coord[1]
    count++
  })
  
  return [y / count, x / count] // Return as [lat, lng] for Leaflet
}

// Helper function to check if a point is inside a polygon
const isPointInPolygon = (point: number[], polygon: number[][]) => {
  const [x, y] = point
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  
  return inside
}

// Helper function to find pipelines within a zone
const getPipelinesInZone = (zone: ZoneData, pipelines: PipelineData[]) => {
  if (!zone.geometry?.coordinates?.[0]) return []
  
  return pipelines.filter(pipeline => {
    if (!pipeline.geometry?.coordinates) return false
    
    // Check if any point of the pipeline is inside the zone
    return pipeline.geometry.coordinates.some(coord => 
      isPointInPolygon(coord, zone.geometry.coordinates[0])
    )
  })
}

interface SimpleMapProps {
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

export function SimpleMap({ onDataUpdate }: SimpleMapProps) {
  const { user } = useAuth()
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [zoneModalOpen, setZoneModalOpen] = useState(false)
  const [markerModalOpen, setMarkerModalOpen] = useState(false)
  const [currentGeometry, setCurrentGeometry] = useState<any>(null)
  const [pipelines, setPipelines] = useState<PipelineData[]>([])
  const [zones, setZones] = useState<ZoneData[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const featureGroupRef = useRef<L.FeatureGroup>(null)
  const layerMapRef = useRef<Map<string, L.Layer>>(new Map())

  const getRiskColor = (riskScore: number) => {
    const red = Math.min(255, Math.floor(riskScore * 283))
    const green = Math.max(0, Math.floor(255 - riskScore * 283))
    return `rgb(${red}, ${green}, 0)`
  }

  const getZoneColor = (zone: ZoneData) => {
    // Calculate efficiency ratio (consumption vs supply)
    if (zone.averageSupply && zone.averageSupply > 0) {
      const efficiency = zone.averageConsumption / zone.averageSupply
      
      if (efficiency > 0.8) return "#ef4444" // Red - high consumption
      if (efficiency > 0.6) return "#f59e0b" // Yellow - moderate consumption
      return "#10b981" // Green - low consumption
    }
    
    // Fallback to population density
    if (zone.population && zone.squareKilometers && zone.squareKilometers > 0) {
      const density = zone.population / zone.squareKilometers
      
      if (density > 10000) return "#8b5cf6" // Purple - high density
      if (density > 5000) return "#06b6d4" // Cyan - medium density
      return "#94a3b8" // Gray - low density
    }
    
    return "#94a3b8" // Default gray
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

  // Add existing features to the editable FeatureGroup
  useEffect(() => {
    if (!featureGroupRef.current) return

    const featureGroup = featureGroupRef.current
    
    // Clear existing layers
    featureGroup.clearLayers()
    layerMapRef.current.clear()

    // Add pipelines to editable group
    pipelines.forEach((pipeline) => {
      if (pipeline.geometry?.coordinates) {
        const polyline = L.polyline(
          pipeline.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]),
          {
            color: getRiskColor(pipeline.riskScore),
            weight: 4,
            opacity: 0.8,
          }
        )
        
        // Store feature metadata
        polyline.feature = {
          type: 'Feature',
          properties: {
            id: pipeline.id,
            type: 'pipeline',
            name: pipeline.name,
            ...pipeline
          },
          geometry: pipeline.geometry
        }
        
        featureGroup.addLayer(polyline)
        layerMapRef.current.set(pipeline.id!, polyline)
      }
    })

    // Add zones to editable group
    zones.forEach((zone) => {
      if (zone.geometry?.coordinates?.[0]) {
        const polygon = L.polygon(
          zone.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]]),
          {
            color: getZoneColor(zone),
            weight: 2,
            fillOpacity: 0.3,
          }
        )
        
        // Store feature metadata
        polygon.feature = {
          type: 'Feature',
          properties: {
            id: zone.id,
            type: 'zone',
            name: zone.name,
            ...zone
          },
          geometry: zone.geometry
        }
        
        featureGroup.addLayer(polygon)
        layerMapRef.current.set(zone.id!, polygon)
      }
    })

    // Add markers to editable group
    markers.forEach((marker) => {
      if (marker.geometry?.coordinates) {
        const markerLayer = L.marker([marker.geometry.coordinates[1], marker.geometry.coordinates[0]])
        
        // Store feature metadata
        markerLayer.feature = {
          type: 'Feature',
          properties: {
            id: marker.id,
            type: 'marker',
            name: marker.name,
            ...marker
          },
          geometry: marker.geometry
        }
        
        featureGroup.addLayer(markerLayer)
        layerMapRef.current.set(marker.id!, markerLayer)
      }
    })
  }, [pipelines, zones, markers])

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

  const handleEdited = async (e: any) => {
    const layers = e.layers
    
    const updatePromises: Promise<void>[] = []
    
    layers.eachLayer(async (layer: any) => {
      const geometry = layer.toGeoJSON().geometry
      const featureId = layer.feature?.properties?.id
      const featureType = layer.feature?.properties?.type
      
      if (featureId && featureType) {
        console.log(`Updating ${featureType} ${featureId} with new geometry:`, geometry)
        
        const updatePromise = (async () => {
          try {
            if (featureType === 'pipeline') {
              await updatePipeline(featureId, { geometry })
              console.log(`Successfully updated pipeline ${featureId}`)
            } else if (featureType === 'zone') {
              await updateZone(featureId, { geometry })
              console.log(`Successfully updated zone ${featureId}`)
            } else if (featureType === 'marker') {
              await updateMarker(featureId, { geometry })
              console.log(`Successfully updated marker ${featureId}`)
            }
          } catch (error) {
            console.error(`Error updating ${featureType} ${featureId}:`, error)
            alert(`Failed to save changes to ${featureType}. Please try again.`)
          }
        })()
        
        updatePromises.push(updatePromise)
      }
    })
    
    // Wait for all updates to complete
    await Promise.all(updatePromises)
    
    // Refresh data to show updated features
    setTimeout(() => {
      loadData()
      onDataUpdate()
    }, 500)
  }

  const handleDeleted = async (e: any) => {
    const layers = e.layers
    
    const deletePromises: Promise<void>[] = []
    
    layers.eachLayer(async (layer: any) => {
      const featureId = layer.feature?.properties?.id
      const featureType = layer.feature?.properties?.type
      const featureName = layer.feature?.properties?.name || 'Unnamed'
      
      if (featureId && featureType) {
        console.log(`Deleting ${featureType} ${featureId}`)
        
        const deletePromise = (async () => {
          try {
            const { deletePipeline, deleteZone, deleteMarker } = await import('@/lib/firestore')
            
            if (featureType === 'pipeline') {
              await deletePipeline(featureId)
              console.log(`Successfully deleted pipeline ${featureId}`)
            } else if (featureType === 'zone') {
              await deleteZone(featureId)
              console.log(`Successfully deleted zone ${featureId}`)
            } else if (featureType === 'marker') {
              await deleteMarker(featureId)
              console.log(`Successfully deleted marker ${featureId}`)
            }
          } catch (error) {
            console.error(`Error deleting ${featureType} ${featureId}:`, error)
            alert(`Failed to delete ${featureName}. Please try again.`)
          }
        })()
        
        deletePromises.push(deletePromise)
      }
    })
    
    // Wait for all deletions to complete
    await Promise.all(deletePromises)
    
    // Refresh data to show remaining features
    setTimeout(() => {
      loadData()
      onDataUpdate()
    }, 500)
  }

  const handleModalClose = () => {
    setPipelineModalOpen(false)
    setZoneModalOpen(false)
    setMarkerModalOpen(false)
    setCurrentGeometry(null)
    loadData()
    onDataUpdate()
  }

  return (
    <div className="h-full w-full relative">
      {/* Custom CSS for markers and tooltips */}
      <style jsx>{`
        .start-point-marker {
          background: transparent !important;
          border: none !important;
        }
        .end-point-marker {
          background: transparent !important;
          border: none !important;
        }
        .zone-label-marker {
          background: transparent !important;
          border: none !important;
        }
        
        /* Custom tooltip styles */
        .leaflet-tooltip {
          background: rgba(0, 0, 0, 0.8) !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
          padding: 8px 12px !important;
          font-size: 12px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        
        .leaflet-tooltip::before {
          border-top-color: rgba(0, 0, 0, 0.8) !important;
        }
      `}</style>
      
      <MapContainer
        center={[6.9271, 79.8612]}
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
            onEdited={handleEdited}
            onDeleted={handleDeleted}
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
            edit={{
              featureGroup: featureGroupRef.current!,
            }}
          />
        </FeatureGroup>

        {/* Render existing pipelines */}
        {pipelines.map(
          (pipeline) =>
            pipeline.geometry?.coordinates && (
              <div key={pipeline.id}>
                {/* Pipeline polyline */}
                <Polyline
                  positions={pipeline.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]])}
                  pathOptions={{
                    color: getRiskColor(pipeline.riskScore),
                    weight: 4,
                    opacity: 0.8,
                  }}
                  eventHandlers={{
                    mouseover: (e) => {
                      const layer = e.target
                      layer.setStyle({
                        weight: 6,
                        opacity: 1
                      })
                    },
                    mouseout: (e) => {
                      const layer = e.target
                      layer.setStyle({
                        weight: 4,
                        opacity: 0.8
                      })
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-lg mb-2">{pipeline.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>From:</strong> {pipeline.startPosition}</p>
                        <p><strong>To:</strong> {pipeline.endPosition}</p>
                        <p><strong>Material:</strong> {pipeline.material}</p>
                        <p><strong>Diameter:</strong> {pipeline.diameter}mm</p>
                        <p><strong>Age:</strong> {pipeline.age} years</p>
                        <p><strong>Risk Score:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            pipeline.riskScore >= 0.7 ? 'bg-red-100 text-red-800' :
                            pipeline.riskScore >= 0.4 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {pipeline.riskScore.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    </div>
                  </Popup>
                  <Tooltip permanent={false} direction="center" className="pipeline-tooltip">
                    <div className="text-center">
                      <strong>{pipeline.name}</strong><br/>
                      {pipeline.startPosition} → {pipeline.endPosition}<br/>
                      Risk: {pipeline.riskScore.toFixed(2)}<br/>
                      {(() => {
                        const pipelineZones = zones.filter(zone => {
                          if (!zone.geometry?.coordinates?.[0] || !pipeline.geometry?.coordinates) return false
                          return pipeline.geometry.coordinates.some(coord => 
                            isPointInPolygon(coord, zone.geometry.coordinates[0])
                          )
                        })
                        if (pipelineZones.length > 0) {
                          return `In: ${pipelineZones[0].name}`
                        }
                        return 'Not in any zone'
                      })()}
                    </div>
                  </Tooltip>
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
              </div>
            ),
        )}

        {/* Render existing zones */}
        {zones.map(
          (zone) =>
            zone.geometry?.coordinates?.[0] && (
              <div key={zone.id}>
                {/* Zone polygon with enhanced interactions */}
                <Polygon
                  positions={zone.geometry.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])}
                  pathOptions={{
                    color: getZoneColor(zone),
                    weight: 2,
                    fillOpacity: 0.3,
                  }}
                  eventHandlers={{
                    mouseover: (e) => {
                      const layer = e.target
                      layer.setStyle({
                        fillOpacity: 0.6,
                        weight: 3
                      })
                    },
                    mouseout: (e) => {
                      const layer = e.target
                      layer.setStyle({
                        fillOpacity: 0.3,
                        weight: 2
                      })
                    }
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-lg mb-2">{zone.name}</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Population:</strong> {zone.population?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Houses:</strong> {zone.houses?.toLocaleString() || 'N/A'}</p>
                        <p><strong>Area:</strong> {zone.squareKilometers} km²</p>
                        <p><strong>Supply:</strong> {zone.averageSupply} m³/day</p>
                        <p><strong>Consumption:</strong> {zone.averageConsumption} m³/day</p>
                        <p><strong>Efficiency:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            zone.averageConsumption > zone.averageSupply * 0.8 ? 'bg-red-100 text-red-800' :
                            zone.averageConsumption > zone.averageSupply * 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-800'
                          }`}>
                            {((zone.averageConsumption / zone.averageSupply) * 100).toFixed(1)}%
                          </span>
                        </p>
                        
                        {/* Show pipelines in this zone */}
                        {(() => {
                          const zonePipelines = getPipelinesInZone(zone, pipelines)
                          if (zonePipelines.length > 0) {
                            return (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="font-semibold text-gray-700 mb-2">
                                  Pipelines in Zone ({zonePipelines.length})
                                </p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {zonePipelines.slice(0, 5).map(pipeline => (
                                    <div key={pipeline.id} className="text-xs bg-gray-50 p-2 rounded">
                                      <p className="font-medium">{pipeline.name}</p>
                                      <p className="text-gray-600">
                                        {pipeline.startPosition} → {pipeline.endPosition}
                                      </p>
                                      <p className="text-gray-500">
                                        Risk: {pipeline.riskScore.toFixed(2)}
                                      </p>
                                    </div>
                                  ))}
                                  {zonePipelines.length > 5 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      +{zonePipelines.length - 5} more pipelines
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                    </div>
                  </Popup>
                  <Tooltip permanent={false} direction="center" className="zone-tooltip">
                    <div className="text-center">
                      <strong>{zone.name}</strong><br/>
                      {zone.population?.toLocaleString()} people<br/>
                      {zone.squareKilometers} km²<br/>
                      {(() => {
                        const zonePipelines = getPipelinesInZone(zone, pipelines)
                        if (zonePipelines.length > 0) {
                          return `${zonePipelines.length} pipeline${zonePipelines.length > 1 ? 's' : ''}`
                        }
                        return 'No pipelines'
                      })()}
                    </div>
                  </Tooltip>
                </Polygon>
                
                {/* Zone name label at centroid */}
                {zone.geometry.coordinates[0] && (
                  <Marker
                    position={getPolygonCentroid(zone.geometry.coordinates[0])}
                    icon={L.divIcon({
                      className: 'zone-label-marker',
                      html: `<span class="text-xs font-medium text-gray-800">${zone.name}</span>`,
                      iconSize: [0, 0],
                      iconAnchor: [0, 0]
                    })}
                  />
                )}
              </div>
            ),
        )}

        {/* Render existing markers */}
        {markers.map(
          (marker) =>
            marker.geometry?.coordinates && (
              <Marker 
                key={marker.id} 
                position={[marker.geometry.coordinates[1], marker.geometry.coordinates[0]]}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-2">{marker.name}</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-gray-700">{marker.description}</p>
                      <p className="text-gray-500 text-xs">
                        <strong>Created:</strong> {marker.createdAt instanceof Date 
                          ? marker.createdAt.toLocaleDateString()
                          : new Date(marker.createdAt).toLocaleDateString()
                        }
                      </p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ),
        )}

        <MapUpdater pipelines={pipelines} zones={zones} markers={markers} />
      </MapContainer>

      {/* Modals */}
      <PipelineModal open={pipelineModalOpen} onClose={handleModalClose} geometry={currentGeometry} />
      <ZoneModal open={zoneModalOpen} onClose={handleModalClose} geometry={currentGeometry} />
      <MarkerModal open={markerModalOpen} onClose={handleModalClose} geometry={currentGeometry} />
    </div>
  )
}

export default SimpleMap