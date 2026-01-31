"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { savePipeline } from "@/lib/firestore"

interface PipelineModalProps {
  open: boolean
  onClose: () => void
  geometry: any
}

export function PipelineModal({ open, onClose, geometry }: PipelineModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    startPosition: "",
    endPosition: "",
    material: "",
    diameter: "",
    soilNature: "",
    landscape: "",
    elevation: "",
    age: "",
    riskScore: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== PIPELINE MODAL SUBMIT START ===")
    console.log("User:", user)
    console.log("Geometry:", geometry)
    console.log("Form data:", formData)
    
    if (!user || !geometry) {
      console.error("❌ Missing user or geometry:", { user: !!user, geometry: !!geometry })
      alert("Error: Missing user authentication or geometry data")
      return
    }

    setLoading(true)
    try {
      console.log("🔄 Starting pipeline save process...")
      console.log("Submitting pipeline with geometry:", geometry)
      
      const pipelineData = {
        geometry,
        name: formData.name,
        startPosition: formData.startPosition,
        endPosition: formData.endPosition,
        material: formData.material,
        diameter: Number.parseFloat(formData.diameter),
        soilNature: formData.soilNature,
        landscape: formData.landscape,
        elevation: Number.parseFloat(formData.elevation),
        age: Number.parseFloat(formData.age),
        riskScore: Number.parseFloat(formData.riskScore),
        createdAt: new Date(),
        userId: user.uid,
      }
      
      console.log("📊 Pipeline data to save:", pipelineData)
      console.log("📊 Pipeline data types:", {
        name: typeof pipelineData.name,
        startPosition: typeof pipelineData.startPosition,
        endPosition: typeof pipelineData.endPosition,
        material: typeof pipelineData.material,
        diameter: typeof pipelineData.diameter,
        soilNature: typeof pipelineData.soilNature,
        landscape: typeof pipelineData.landscape,
        elevation: typeof pipelineData.elevation,
        age: typeof pipelineData.age,
        riskScore: typeof pipelineData.riskScore,
        createdAt: typeof pipelineData.createdAt,
        userId: typeof pipelineData.userId,
        geometry: typeof pipelineData.geometry
      })
      
      const result = await savePipeline(pipelineData)
      console.log("✅ Pipeline saved successfully with ID:", result)
      
      setFormData({
        name: "",
        startPosition: "",
        endPosition: "",
        material: "",
        diameter: "",
        soilNature: "",
        landscape: "",
        elevation: "",
        age: "",
        riskScore: "",
      })

      onClose()
      console.log("=== PIPELINE MODAL SUBMIT SUCCESS ===")
    } catch (error) {
      console.error("❌ Error saving pipeline:", error)
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`Error saving pipeline: ${error.message}`)
    } finally {
      setLoading(false)
      console.log("=== PIPELINE MODAL SUBMIT END ===")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const suggestAge = () => {
    const suggestions = [
      "Check municipal records for installation date",
      "Examine pipe markings or manufacturer stamps",
      "Consult with local water authority archives",
      "Estimate based on surrounding infrastructure age",
      "Use ground-penetrating radar for pipe assessment",
    ]

    alert(`Age Estimation Suggestions:\n\n${suggestions.join("\n")}`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle>Pipeline Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Main Supply Line A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startPosition">Starting Position</Label>
            <Input
              id="startPosition"
              value={formData.startPosition}
              onChange={(e) => handleInputChange("startPosition", e.target.value)}
              placeholder="e.g., Pump Station A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endPosition">Ending Position</Label>
            <Input
              id="endPosition"
              value={formData.endPosition}
              onChange={(e) => handleInputChange("endPosition", e.target.value)}
              placeholder="e.g., Distribution Point B"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={formData.material}
              onChange={(e) => handleInputChange("material", e.target.value)}
              placeholder="e.g., PVC, Cast Iron, Steel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diameter">Diameter (mm)</Label>
            <Input
              id="diameter"
              type="number"
              value={formData.diameter}
              onChange={(e) => handleInputChange("diameter", e.target.value)}
              placeholder="e.g., 150"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="soilNature">Soil Nature</Label>
            <Input
              id="soilNature"
              value={formData.soilNature}
              onChange={(e) => handleInputChange("soilNature", e.target.value)}
              placeholder="e.g., Clay, Sandy, Rocky"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landscape">Landscape</Label>
            <Input
              id="landscape"
              value={formData.landscape}
              onChange={(e) => handleInputChange("landscape", e.target.value)}
              placeholder="e.g., Urban, Rural, Industrial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="elevation">Elevation (m)</Label>
            <Input
              id="elevation"
              type="number"
              step="0.1"
              value={formData.elevation}
              onChange={(e) => handleInputChange("elevation", e.target.value)}
              placeholder="e.g., 25.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age (years)</Label>
            <div className="flex gap-2">
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="e.g., 15"
                required
              />
              <Button type="button" variant="outline" onClick={suggestAge}>
                Suggest
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskScore">Risk Score (0.0 - 0.9)</Label>
            <Input
              id="riskScore"
              type="number"
              step="0.1"
              min="0"
              max="0.9"
              value={formData.riskScore}
              onChange={(e) => handleInputChange("riskScore", e.target.value)}
              placeholder="e.g., 0.3"
              required
            />
            <p className="text-xs text-gray-600">0.0 = Low Risk (Green) → 0.9 = High Risk (Red)</p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Pipeline"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
