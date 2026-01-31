"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Edit, MapPin, Route, Square } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  type PipelineData,
  type ZoneData,
  type MarkerData,
  getPipelines,
  getZones,
  getMarkers,
  updatePipeline,
  updateZone,
  updateMarker,
  deletePipeline,
  deleteZone,
  deleteMarker,
} from "@/lib/firestore"

interface DashboardProps {
  onDataUpdate: () => void
}

export function Dashboard({ onDataUpdate }: DashboardProps) {
  const { user } = useAuth()
  const [pipelines, setPipelines] = useState<PipelineData[]>([])
  const [zones, setZones] = useState<ZoneData[]>([])
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editType, setEditType] = useState<"pipeline" | "zone" | "marker" | null>(null)
  const [loading, setLoading] = useState(false)

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

  const handleEdit = (item: any, type: "pipeline" | "zone" | "marker") => {
    setEditingItem({ ...item })
    setEditType(type)
  }

  const handleDelete = async (id: string, type: "pipeline" | "zone" | "marker") => {
    if (!confirm("Are you sure you want to delete this item?")) return

    setLoading(true)
    try {
      if (type === "pipeline") {
        await deletePipeline(id)
      } else if (type === "zone") {
        await deleteZone(id)
      } else if (type === "marker") {
        await deleteMarker(id)
      }

      await loadData()
      onDataUpdate()
    } catch (error) {
      console.error("Error deleting item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editingItem || !editType) return

    setLoading(true)
    try {
      const { id, geometry, createdAt, userId, ...updateData } = editingItem

      if (editType === "pipeline") {
        await updatePipeline(id, updateData)
      } else if (editType === "zone") {
        await updateZone(id, updateData)
      } else if (editType === "marker") {
        await updateMarker(id, updateData)
      }

      setEditingItem(null)
      setEditType(null)
      await loadData()
      onDataUpdate()
    } catch (error) {
      console.error("Error updating item:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (riskScore: number) => {
    const red = Math.min(255, Math.floor(riskScore * 283))
    const green = Math.max(0, Math.floor(255 - riskScore * 283))
    return `rgb(${red}, ${green}, 0)`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Beautiful modern dashboard header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Infrastructure Dashboard</h2>
          <p className="text-gray-600 mt-1">Monitor and manage water infrastructure assets</p>
        </div>
        
        {/* Beautiful statistics cards */}
        <div className="flex gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/50 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-200/50">
                <Route className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-blue-900">{pipelines.length}</div>
                <div className="text-blue-600 text-sm font-medium">Pipelines</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200/50 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-200/50">
                <Square className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-purple-900">{zones.length}</div>
                <div className="text-purple-600 text-sm font-medium">Zones</div>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-200/50">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold text-emerald-900">{markers.length}</div>
                <div className="text-emerald-600 text-sm font-medium">Markers</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pipelines" className="w-full">
        <div className="mb-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3 bg-gray-100/80 p-1 rounded-xl border border-gray-200/50 shadow-lg">
            <TabsTrigger 
              value="pipelines" 
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-gray-600 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Route className="w-4 h-4" />
              Pipelines
            </TabsTrigger>
            <TabsTrigger 
              value="zones" 
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-gray-600 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <Square className="w-4 h-4" />
              Zones
            </TabsTrigger>
            <TabsTrigger 
              value="markers" 
              className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-gray-600 transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md"
            >
              <MapPin className="w-4 h-4" />
              Markers
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid gap-4">
            {pipelines.map((pipeline) => (
              <Card
                key={pipeline.id}
                className="bg-white border border-gray-200/50 hover:shadow-lg transition-all duration-200 rounded-xl overflow-hidden"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Route className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-gray-900">{pipeline.name}</CardTitle>
                        <p className="text-gray-600 text-sm mt-1">
                          {pipeline.startPosition} → {pipeline.endPosition}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div 
                        className="px-3 py-1 rounded-lg text-white text-sm font-medium shadow-md"
                        style={{ backgroundColor: getRiskColor(pipeline.riskScore) }}
                      >
                        Risk: {pipeline.riskScore.toFixed(2)}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(pipeline, "pipeline")}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200 hover:border-blue-300 text-blue-600 hover:text-blue-700 shadow-sm"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(pipeline.id!, "pipeline")}
                          disabled={loading}
                          className="bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200/50">
                      <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">Diameter</div>
                      <div className="text-lg font-semibold text-blue-900">{pipeline.diameter}mm</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200/50">
                      <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-1">Material</div>
                      <div className="text-lg font-semibold text-purple-900">{pipeline.material}</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200/50">
                      <div className="text-xs font-medium text-orange-600 uppercase tracking-wide mb-1">Age</div>
                      <div className="text-lg font-semibold text-orange-900">{pipeline.age} years</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200/50">
                      <div className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">Elevation</div>
                      <div className="text-lg font-semibold text-emerald-900">{pipeline.elevation}m</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-lg border border-gray-200/50">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Soil Nature</div>
                      <div className="text-sm font-medium text-gray-800">{pipeline.soilNature}</div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg border border-indigo-200/50">
                      <div className="text-xs font-medium text-indigo-600 uppercase tracking-wide mb-1">Landscape</div>
                      <div className="text-sm font-medium text-indigo-800">{pipeline.landscape}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="grid gap-4">
            {zones.map((zone) => (
              <Card
                key={zone.id}
                className="bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <Square className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-white">{zone.name}</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">
                          {zone.population} residents • {zone.houses} houses
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(zone, "zone")}
                        className="bg-slate-600/50 hover:bg-purple-600/20 border-slate-500 hover:border-purple-500 text-slate-300 hover:text-purple-400"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(zone.id!, "zone")}
                        disabled={loading}
                        className="bg-slate-600/50 hover:bg-red-600/20 border-slate-500 hover:border-red-500 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Houses</div>
                      <div className="text-lg font-semibold text-white">{zone.houses}</div>
                    </div>
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Meters</div>
                      <div className="text-lg font-semibold text-white">{zone.meters}</div>
                    </div>
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Population</div>
                      <div className="text-lg font-semibold text-white">{zone.population}</div>
                    </div>
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Area</div>
                      <div className="text-lg font-semibold text-white">{zone.squareKilometers} km²</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Avg Supply</div>
                      <div className="text-sm font-semibold text-green-400">{zone.averageSupply} m³/day</div>
                    </div>
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Avg Consumption</div>
                      <div className="text-sm font-semibold text-orange-400">{zone.averageConsumption} m³/day</div>
                    </div>
                    <div className="bg-slate-600/30 p-3 rounded-lg border border-slate-500/30">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Flow Rate</div>
                      <div className="text-sm font-semibold text-blue-400">{zone.cubicMetersPerDay} m³/day</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="markers" className="space-y-4">
          <div className="grid gap-4">
            {markers.map((marker) => (
              <Card
                key={marker.id}
                className="bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center border border-emerald-500/30">
                        <MapPin className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-white">{marker.name}</CardTitle>
                        <p className="text-slate-400 text-sm mt-1">Point of Interest</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(marker, "marker")}
                        className="bg-slate-600/50 hover:bg-emerald-600/20 border-slate-500 hover:border-emerald-500 text-slate-300 hover:text-emerald-400"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(marker.id!, "marker")}
                        disabled={loading}
                        className="bg-slate-600/50 hover:bg-red-600/20 border-slate-500 hover:border-red-500 text-slate-300 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="bg-slate-600/30 p-4 rounded-lg border border-slate-500/30">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Description</div>
                    <div className="text-slate-200 leading-relaxed">{marker.description}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog
        open={!!editingItem}
        onOpenChange={() => {
          setEditingItem(null)
          setEditType(null)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-800 rounded-lg shadow-2xl border border-slate-700" style={{ zIndex: 9999 }}>
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-bold text-white">
              Edit {editType === "pipeline" ? "Pipeline" : editType === "zone" ? "Zone" : "Marker"}
            </DialogTitle>
            <p className="text-slate-400 mt-1">Update the information for this {editType}</p>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              {editType === "pipeline" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Pipeline Name</Label>
                    <Input
                      value={editingItem.name || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Starting Position</Label>
                    <Input
                      value={editingItem.startPosition || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, startPosition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ending Position</Label>
                    <Input
                      value={editingItem.endPosition || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, endPosition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Input
                      value={editingItem.material || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, material: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Diameter (mm)</Label>
                    <Input
                      type="number"
                      value={editingItem.diameter || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, diameter: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Soil Nature</Label>
                    <Input
                      value={editingItem.soilNature || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, soilNature: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Landscape</Label>
                    <Input
                      value={editingItem.landscape || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, landscape: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Elevation (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingItem.elevation || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, elevation: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Age (years)</Label>
                    <Input
                      type="number"
                      value={editingItem.age || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, age: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Score (0.0 - 0.9)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="0.9"
                      value={editingItem.riskScore || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, riskScore: Number.parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              )}

              {editType === "zone" && (
                <>
                  <div className="space-y-2">
                    <Label>Zone Name</Label>
                    <Input
                      value={editingItem.name || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Houses</Label>
                    <Input
                      type="number"
                      value={editingItem.houses || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, houses: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meters</Label>
                    <Input
                      type="number"
                      value={editingItem.meters || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, meters: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Population</Label>
                    <Input
                      type="number"
                      value={editingItem.population || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, population: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Supply (L/day)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingItem.averageSupply || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, averageSupply: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Average Consumption (L/day)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingItem.averageConsumption || ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, averageConsumption: Number.parseFloat(e.target.value) })
                      }
                    />
                  </div>
                </>
              )}

              {editType === "marker" && (
                <>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editingItem.name || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={editingItem.description || ""}
                      onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingItem(null)
                    setEditType(null)
                  }}
                  className="flex-1 bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={loading} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
