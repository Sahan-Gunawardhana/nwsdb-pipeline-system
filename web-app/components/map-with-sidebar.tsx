"use client"

import { useState, useEffect } from "react"
import { SimpleMap } from "./simple-map"
import { FeatureSidebar } from "./feature-sidebar"
import { useAuth } from "@/lib/auth-context"
import { useErrorToast } from "@/components/error-toast"
import { LoadingState, ErrorState } from "@/components/loading-error-states"
import { type PipelineData, type ZoneData, type MarkerData, getPipelines, getZones, getMarkers } from "@/lib/firestore"

interface MapWithSidebarProps {
  onDataUpdate?: () => void
}

export function MapWithSidebar({ onDataUpdate }: MapWithSidebarProps) {
  const { user } = useAuth()
  const [pipelines, setPipelines] = useState<PipelineData[]>([])
  const [zones, setZones] = useState<ZoneData[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<{
    id: string
    type: 'pipeline' | 'zone' | 'marker'
  } | null>(null)
  const { showError, showSuccess } = useErrorToast()

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
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
      setError("Failed to load map data. Please try again.")
      showError("Failed to load map data", "There was an error loading the map features.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleDataUpdate = () => {
    loadData()
    onDataUpdate?.()
  }

  const handleFeatureSelect = (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker',
    featureData: any
  ) => {
    setSelectedFeature({ id: featureId, type: featureType })
    // You can add map centering logic here if needed
  }

  const handleFeatureEdit = (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker',
    featureData: any
  ) => {
    setSelectedFeature({ id: featureId, type: featureType })
    // Trigger edit mode on the map
  }

  const handleFeatureDelete = async (
    featureId: string,
    featureType: 'pipeline' | 'zone' | 'marker'
  ) => {
    if (!confirm(`Are you sure you want to delete this ${featureType}?`)) {
      return
    }

    try {
      const { deletePipeline, deleteZone, deleteMarker } = await import('@/lib/firestore')
      
      if (featureType === 'pipeline') {
        await deletePipeline(featureId)
        showSuccess("Pipeline deleted", "Pipeline has been successfully deleted from the map.")
      } else if (featureType === 'zone') {
        await deleteZone(featureId)
        showSuccess("Zone deleted", "Zone has been successfully deleted from the map.")
      } else if (featureType === 'marker') {
        await deleteMarker(featureId)
        showSuccess("Marker deleted", "Marker has been successfully deleted from the map.")
      }

      // Clear selection if deleted feature was selected
      if (selectedFeature?.id === featureId) {
        setSelectedFeature(null)
      }

      handleDataUpdate()
    } catch (error) {
      console.error('Error deleting feature:', error)
      showError("Delete failed", `Failed to delete ${featureType}. Please try again.`)
    }
  }

  if (loading) {
    return <LoadingState message="Loading map data..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load map"
        message={error}
        onRetry={loadData}
        showDetails={false}
      />
    )
  }

  return (
    <div className="h-full">
      {/* Just the Map - no sidebar */}
      <SimpleMap onDataUpdate={handleDataUpdate} />
    </div>
  )
}