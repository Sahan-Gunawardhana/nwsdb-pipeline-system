"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Edit, Trash2, MapPin, Route, Square, Eye } from "lucide-react"
import { PipelineData, ZoneData, MarkerData } from "@/lib/firestore"

interface FeatureSidebarProps {
  pipelines: PipelineData[]
  zones: ZoneData[]
  markers: MarkerData[]
  selectedFeature: { id: string; type: 'pipeline' | 'zone' | 'marker' } | null
  onFeatureSelect: (featureId: string, featureType: 'pipeline' | 'zone' | 'marker', featureData: any) => void
  onFeatureEdit: (featureId: string, featureType: 'pipeline' | 'zone' | 'marker', featureData: any) => void
  onFeatureDelete: (featureId: string, featureType: 'pipeline' | 'zone' | 'marker') => void
  onRefresh: () => void
}

export function FeatureSidebar({
  pipelines,
  zones,
  markers,
  selectedFeature,
  onFeatureSelect,
  onFeatureEdit,
  onFeatureDelete,
  onRefresh
}: FeatureSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("pipelines")

  // Filter functions with null checks
  const filterPipelines = () => {
    return pipelines.filter(pipeline =>
      (pipeline.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pipeline.material || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pipeline.startPosition || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pipeline.endPosition || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filterZones = () => {
    return zones.filter(zone =>
      (zone.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filterMarkers = () => {
    return markers.filter(marker =>
      (marker.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (marker.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 0.7) return "bg-red-500"
    if (riskScore >= 0.4) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getRiskLabel = (riskScore: number) => {
    if (riskScore >= 0.7) return "High Risk"
    if (riskScore >= 0.4) return "Medium Risk"
    return "Low Risk"
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Infrastructure</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipelines" className="flex items-center gap-1 text-xs">
              <Route className="w-3 h-3" />
              Pipelines
              <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {filterPipelines().length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center gap-1 text-xs">
              <Square className="w-3 h-3" />
              Zones
              <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {filterZones().length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="markers" className="flex items-center gap-1 text-xs">
              <MapPin className="w-3 h-3" />
              Markers
              <span className="ml-1 text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">
                {filterMarkers().length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          <TabsContent value="pipelines" className="h-full mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 pb-4">
                {filterPipelines().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Route className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No pipelines found</p>
                    {searchTerm && (
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search
                      </p>
                    )}
                  </div>
                ) : (
                  filterPipelines().map((pipeline) => (
                    <Card
                      key={pipeline.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedFeature?.id === pipeline.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => onFeatureSelect(pipeline.id!, 'pipeline', pipeline)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm font-medium text-gray-900">
                              {pipeline.name}
                            </CardTitle>
                            <p className="text-xs text-gray-500 mt-1">
                              {pipeline.startPosition} → {pipeline.endPosition}
                            </p>
                          </div>
                          <span
                            className={`${getRiskColor(pipeline.riskScore)} text-white text-xs px-2 py-1 rounded-full`}
                          >
                            {getRiskLabel(pipeline.riskScore)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Material:</span>
                            <p className="font-medium">{pipeline.material}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Diameter:</span>
                            <p className="font-medium">{pipeline.diameter}mm</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Age:</span>
                            <p className="font-medium">{pipeline.age} years</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Risk:</span>
                            <p className="font-medium">{pipeline.riskScore.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureSelect(pipeline.id!, 'pipeline', pipeline)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureEdit(pipeline.id!, 'pipeline', pipeline)
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureDelete(pipeline.id!, 'pipeline')
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="zones" className="h-full mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 pb-4">
                {filterZones().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Square className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No zones found</p>
                    {searchTerm && (
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search
                      </p>
                    )}
                  </div>
                ) : (
                  filterZones().map((zone) => (
                    <Card
                      key={zone.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedFeature?.id === zone.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => onFeatureSelect(zone.id!, 'zone', zone)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900">
                          {zone.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                          {zone.population} residents • {zone.houses} houses
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Area:</span>
                            <p className="font-medium">{zone.squareKilometers} km²</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Meters:</span>
                            <p className="font-medium">{zone.meters}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Supply:</span>
                            <p className="font-medium">{zone.averageSupply} m³/day</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Consumption:</span>
                            <p className="font-medium">{zone.averageConsumption} m³/day</p>
                          </div>
                        </div>
                        <div className="flex gap-1 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureSelect(zone.id!, 'zone', zone)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureEdit(zone.id!, 'zone', zone)
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureDelete(zone.id!, 'zone')
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="markers" className="h-full mt-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-2 pb-4">
                {filterMarkers().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No markers found</p>
                    {searchTerm && (
                      <p className="text-xs text-gray-400 mt-1">
                        Try adjusting your search
                      </p>
                    )}
                  </div>
                ) : (
                  filterMarkers().map((marker) => (
                    <Card
                      key={marker.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedFeature?.id === marker.id ? 'ring-2 ring-green-500' : ''
                      }`}
                      onClick={() => onFeatureSelect(marker.id!, 'marker', marker)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900">
                          {marker.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                          {marker.description}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureSelect(marker.id!, 'marker', marker)
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs h-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureEdit(marker.id!, 'marker', marker)
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 text-red-600 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFeatureDelete(marker.id!, 'marker')
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}