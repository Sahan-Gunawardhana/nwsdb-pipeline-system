"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, MapPin, Route, Square } from "lucide-react"
import { PipelineData, ZoneData, MarkerData } from "@/lib/firestore"

interface ContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  feature: PipelineData | ZoneData | MarkerData | null
  featureType: 'pipeline' | 'zone' | 'marker' | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ContextMenu({
  isOpen,
  position,
  feature,
  featureType,
  onClose,
  onEdit,
  onDelete
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !feature || !featureType) return null

  const getFeatureIcon = () => {
    switch (featureType) {
      case 'pipeline':
        return <Route className="w-4 h-4" />
      case 'zone':
        return <Square className="w-4 h-4" />
      case 'marker':
        return <MapPin className="w-4 h-4" />
      default:
        return null
    }
  }

  const getFeatureTitle = () => {
    return feature.name || `Unnamed ${featureType}`
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]" 
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
      />
      
      {/* Context Menu */}
      <div
        ref={menuRef}
        className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px]"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -10px)'
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded">
              {getFeatureIcon()}
            </div>
            <div>
              <div className="font-medium text-sm text-gray-900">
                {getFeatureTitle()}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {featureType}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="py-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto font-normal text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => {
              onEdit()
              onClose()
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit {featureType}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-3 py-2 h-auto font-normal text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {featureType}
          </Button>
        </div>

        {/* Feature Details */}
        <div className="px-3 py-2 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {featureType === 'pipeline' && (
              <div>
                <div>Material: {(feature as PipelineData).material}</div>
                <div>Diameter: {(feature as PipelineData).diameter}mm</div>
                <div>Risk: {(feature as PipelineData).riskScore.toFixed(2)}</div>
              </div>
            )}
            {featureType === 'zone' && (
              <div>
                <div>Population: {(feature as ZoneData).population}</div>
                <div>Houses: {(feature as ZoneData).houses}</div>
                <div>Area: {(feature as ZoneData).squareKilometers} km²</div>
              </div>
            )}
            {featureType === 'marker' && (
              <div>
                <div className="truncate max-w-[150px]">
                  {(feature as MarkerData).description}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Hook for managing context menu state
export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [feature, setFeature] = useState<PipelineData | ZoneData | MarkerData | null>(null)
  const [featureType, setFeatureType] = useState<'pipeline' | 'zone' | 'marker' | null>(null)

  const openContextMenu = (
    event: MouseEvent | React.MouseEvent,
    targetFeature: PipelineData | ZoneData | MarkerData,
    targetFeatureType: 'pipeline' | 'zone' | 'marker'
  ) => {
    event.preventDefault()
    event.stopPropagation()

    // Calculate position, ensuring menu stays within viewport
    const x = Math.min(event.clientX, window.innerWidth - 220)
    const y = Math.min(event.clientY, window.innerHeight - 200)

    setPosition({ x, y })
    setFeature(targetFeature)
    setFeatureType(targetFeatureType)
    setIsOpen(true)
  }

  const closeContextMenu = () => {
    setIsOpen(false)
    setFeature(null)
    setFeatureType(null)
  }

  return {
    isOpen,
    position,
    feature,
    featureType,
    openContextMenu,
    closeContextMenu
  }
}