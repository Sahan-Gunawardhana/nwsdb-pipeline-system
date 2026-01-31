"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Search, Plus } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useErrorToast } from "@/components/error-toast"
import { LoadingState, ErrorState, EmptyState } from "@/components/loading-error-states"
import { 
  type PipelineData, 
  type ZoneData, 
  type MarkerData, 
  getPipelines, 
  getZones, 
  getMarkers,
  deletePipeline,
  deleteZone,
  deleteMarker
} from "@/lib/firestore"

interface PipelinesTableProps {
  onDataUpdate: () => void
}

export function PipelinesTable({ onDataUpdate }: PipelinesTableProps) {
  const { user } = useAuth()
  const [pipelines, setPipelines] = useState<PipelineData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showError, showSuccess } = useErrorToast()

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getPipelines(user.uid)
      setPipelines(data)
    } catch (error) {
      console.error("Error loading pipelines:", error)
      setError("Failed to load pipelines. Please try again.")
      showError("Failed to load pipelines", "There was an error loading the pipeline data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete pipeline "${name}"?`)) {
      return
    }

    try {
      await deletePipeline(id)
      showSuccess("Pipeline deleted", `Pipeline "${name}" has been successfully deleted.`)
      loadData()
      onDataUpdate()
    } catch (error) {
      console.error("Error deleting pipeline:", error)
      showError("Delete failed", "Failed to delete pipeline. Please try again.")
    }
  }

  const filteredPipelines = pipelines.filter(pipeline =>
    (pipeline.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pipeline.material || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pipeline.startPosition || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pipeline.endPosition || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.7) return "text-red-600 bg-red-50"
    if (riskScore >= 0.4) return "text-yellow-600 bg-yellow-50"
    return "text-green-600 bg-green-50"
  }

  if (loading) {
    return <LoadingState message="Loading pipelines..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load pipelines"
        message={error}
        onRetry={loadData}
        showDetails={false}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pipelines ({filteredPipelines.length})</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Pipeline
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search pipelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>From → To</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Diameter</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPipelines.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <EmptyState
                    title="No pipelines found"
                    message={searchTerm ? `No pipelines match "${searchTerm}"` : "No pipelines have been created yet."}
                    icon={<Search className="h-8 w-8" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredPipelines.map((pipeline) => (
                <TableRow key={pipeline.id}>
                  <TableCell className="font-medium">{pipeline.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{pipeline.startPosition}</div>
                      <div className="text-gray-500">→ {pipeline.endPosition}</div>
                    </div>
                  </TableCell>
                  <TableCell>{pipeline.material}</TableCell>
                  <TableCell>{pipeline.diameter}mm</TableCell>
                  <TableCell>{pipeline.age} years</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(pipeline.riskScore)}`}>
                      {pipeline.riskScore.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(pipeline.id!, pipeline.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface ZonesTableProps {
  onDataUpdate: () => void
}

export function ZonesTable({ onDataUpdate }: ZonesTableProps) {
  const { user } = useAuth()
  const [zones, setZones] = useState<ZoneData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showError, showSuccess } = useErrorToast()

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getZones(user.uid)
      setZones(data)
    } catch (error) {
      console.error("Error loading zones:", error)
      setError("Failed to load zones. Please try again.")
      showError("Failed to load zones", "There was an error loading the zone data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete zone "${name}"?`)) {
      return
    }

    try {
      await deleteZone(id)
      showSuccess("Zone deleted", `Zone "${name}" has been successfully deleted.`)
      loadData()
      onDataUpdate()
    } catch (error) {
      console.error("Error deleting zone:", error)
      showError("Delete failed", "Failed to delete zone. Please try again.")
    }
  }

  const filteredZones = zones.filter(zone =>
    (zone.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Zones ({filteredZones.length})</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Zone
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search zones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Population</TableHead>
              <TableHead>Houses</TableHead>
              <TableHead>Area</TableHead>
              <TableHead>Supply</TableHead>
              <TableHead>Consumption</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <EmptyState
                    title="No zones found"
                    message={searchTerm ? `No zones match "${searchTerm}"` : "No zones have been created yet."}
                    icon={<Search className="h-8 w-8" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium">{zone.name}</TableCell>
                  <TableCell>{zone.population}</TableCell>
                  <TableCell>{zone.houses}</TableCell>
                  <TableCell>{zone.squareKilometers} km²</TableCell>
                  <TableCell>{zone.averageSupply} m³/day</TableCell>
                  <TableCell>{zone.averageConsumption} m³/day</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(zone.id!, zone.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface MarkersTableProps {
  onDataUpdate: () => void
}

export function MarkersTable({ onDataUpdate }: MarkersTableProps) {
  const { user } = useAuth()
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showError, showSuccess } = useErrorToast()

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await getMarkers(user.uid)
      setMarkers(data)
    } catch (error) {
      console.error("Error loading markers:", error)
      setError("Failed to load markers. Please try again.")
      showError("Failed to load markers", "There was an error loading the marker data.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete marker "${name}"?`)) {
      return
    }

    try {
      await deleteMarker(id)
      showSuccess("Marker deleted", `Marker "${name}" has been successfully deleted.`)
      loadData()
      onDataUpdate()
    } catch (error) {
      console.error("Error deleting marker:", error)
      showError("Delete failed", "Failed to delete marker. Please try again.")
    }
  }

  const filteredMarkers = markers.filter(marker =>
    (marker.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (marker.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <LoadingState message="Loading markers..." />
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load markers"
        message={error}
        onRetry={loadData}
        showDetails={false}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Markers ({filteredMarkers.length})</CardTitle>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Marker
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search markers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMarkers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <EmptyState
                    title="No markers found"
                    message={searchTerm ? `No markers match "${searchTerm}"` : "No markers have been created yet."}
                    icon={<Search className="h-8 w-8" />}
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredMarkers.map((marker) => (
                <TableRow key={marker.id}>
                  <TableCell className="font-medium">{marker.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{marker.description}</TableCell>
                  <TableCell>
                    {marker.createdAt instanceof Date 
                      ? marker.createdAt.toLocaleDateString()
                      : new Date(marker.createdAt).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(marker.id!, marker.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}