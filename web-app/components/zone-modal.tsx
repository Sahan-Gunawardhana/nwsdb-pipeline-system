"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { saveZone } from "@/lib/firestore"

interface ZoneModalProps {
  open: boolean
  onClose: () => void
  geometry: any
}

export function ZoneModal({ open, onClose, geometry }: ZoneModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    houses: "",
    meters: "",
    population: "",
    averageSupply: "",
    averageConsumption: "",
    squareKilometers: "",
    cubicMetersPerDay: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("=== ZONE MODAL SUBMIT START ===")
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
      console.log("🔄 Starting zone save process...")
      console.log("Submitting zone with geometry:", geometry)
      
      const zoneData = {
        geometry,
        name: formData.name,
        houses: Number.parseInt(formData.houses),
        meters: Number.parseInt(formData.meters),
        population: Number.parseInt(formData.population),
        averageSupply: Number.parseFloat(formData.averageSupply),
        averageConsumption: Number.parseFloat(formData.averageConsumption),
        squareKilometers: Number.parseFloat(formData.squareKilometers),
        cubicMetersPerDay: Number.parseFloat(formData.cubicMetersPerDay),
        createdAt: new Date(),
        userId: user.uid,
      }
      
      console.log("📊 Zone data to save:", zoneData)
      console.log("📊 Zone data types:", {
        name: typeof zoneData.name,
        houses: typeof zoneData.houses,
        meters: typeof zoneData.meters,
        population: typeof zoneData.population,
        averageSupply: typeof zoneData.averageSupply,
        averageConsumption: typeof zoneData.averageConsumption,
        squareKilometers: typeof zoneData.squareKilometers,
        cubicMetersPerDay: typeof zoneData.cubicMetersPerDay,
        createdAt: typeof zoneData.createdAt,
        userId: typeof zoneData.userId,
        geometry: typeof zoneData.geometry
      })
      
      const result = await saveZone(zoneData)
      console.log("✅ Zone saved successfully with ID:", result)
      
      setFormData({
        name: "",
        houses: "",
        meters: "",
        population: "",
        averageSupply: "",
        averageConsumption: "",
        squareKilometers: "",
        cubicMetersPerDay: "",
      })

      onClose()
      console.log("=== ZONE MODAL SUBMIT SUCCESS ===")
    } catch (error) {
      console.error("❌ Error saving zone:", error)
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`Error saving zone: ${error.message}`)
    } finally {
      setLoading(false)
      console.log("=== ZONE MODAL SUBMIT END ===")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999 }}>
        <DialogHeader>
          <DialogTitle>Zone Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Zone Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., Residential Area A"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="houses">Number of Houses</Label>
            <Input
              id="houses"
              type="number"
              value={formData.houses}
              onChange={(e) => handleInputChange("houses", e.target.value)}
              placeholder="e.g., 150"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meters">Number of Meters</Label>
            <Input
              id="meters"
              type="number"
              value={formData.meters}
              onChange={(e) => handleInputChange("meters", e.target.value)}
              placeholder="e.g., 145"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="population">Population</Label>
            <Input
              id="population"
              type="number"
              value={formData.population}
              onChange={(e) => handleInputChange("population", e.target.value)}
              placeholder="e.g., 600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="averageSupply">Average Supply (m³/day)</Label>
            <Input
              id="averageSupply"
              type="number"
              step="0.1"
              value={formData.averageSupply}
              onChange={(e) => handleInputChange("averageSupply", e.target.value)}
              placeholder="e.g., 12.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="averageConsumption">Average Consumption (m³/day)</Label>
            <Input
              id="averageConsumption"
              type="number"
              step="0.1"
              value={formData.averageConsumption}
              onChange={(e) => handleInputChange("averageConsumption", e.target.value)}
              placeholder="e.g., 9.6"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="squareKilometers">Square Kilometers</Label>
            <Input
              id="squareKilometers"
              type="number"
              step="0.01"
              value={formData.squareKilometers}
              onChange={(e) => handleInputChange("squareKilometers", e.target.value)}
              placeholder="e.g., 2.5"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cubicMetersPerDay">Cubic Meters per Day</Label>
            <Input
              id="cubicMetersPerDay"
              type="number"
              step="0.1"
              value={formData.cubicMetersPerDay}
              onChange={(e) => handleInputChange("cubicMetersPerDay", e.target.value)}
              placeholder="e.g., 12.5"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Zone"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
