import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore"
import { db } from "./firebase"

// Helper function to convert geometry to Firestore-compatible format
const convertGeometryForFirestore = (geometry: any) => {
  if (!geometry) return null
  
  // Store geometry as JSON string to avoid nested array issues
  try {
    const geometryString = JSON.stringify(geometry)
    return geometryString
  } catch (error) {
    console.error("Error converting geometry to string:", error)
    return null
  }
}

// Helper function to prepare update data with geometry conversion
const prepareUpdateData = (data: any) => {
  const updateData = { ...data }
  
  // Convert geometry to string if it exists in the update data
  if (updateData.geometry) {
    updateData.geometry = convertGeometryForFirestore(updateData.geometry)
  }
  
  return updateData
}

export interface PipelineData {
  id?: string
  geometry: string | any // Can be string (stored) or object (parsed)
  name: string
  startPosition: string
  endPosition: string
  material: string
  diameter: number
  soilNature: string
  landscape: string
  elevation: number
  age: number
  riskScore: number
  createdAt: Date | Timestamp
  userId: string
}

export interface ZoneData {
  id?: string
  geometry: string | any // Can be string (stored) or object (parsed)
  name: string
  houses: number
  meters: number
  population: number
  averageSupply: number
  averageConsumption: number
  squareKilometers: number
  cubicMetersPerDay: number
  createdAt: Date | Timestamp
  userId: string
}

export interface MarkerData {
  id?: string
  geometry: string | any // Can be string (stored) or object (parsed)
  name: string
  description: string
  createdAt: Date | Timestamp
  userId: string
}

// Pipeline operations
export const savePipeline = async (data: Omit<PipelineData, "id">) => {
  try {
    // Validate required fields
    if (!data.name || !data.userId) {
      throw new Error("Pipeline name and user ID are required")
    }

    if (!data.geometry) {
      throw new Error("Pipeline geometry is required")
    }

    const dataWithTimestamp = {
      ...data,
      geometry: convertGeometryForFirestore(data.geometry),
      createdAt: Timestamp.fromDate(data.createdAt as Date)
    }
    
    const docRef = await addDoc(collection(db, "pipelines"), dataWithTimestamp)
    return docRef.id
  } catch (error: any) {
    console.error("Error in savePipeline:", error)
    
    // Provide user-friendly error messages
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to save pipelines. Please check your authentication.")
    } else if (error.code === 'unavailable') {
      throw new Error("Service is temporarily unavailable. Please try again later.")
    } else if (error.code === 'resource-exhausted') {
      throw new Error("Service quota exceeded. Please try again later.")
    } else {
      throw new Error(`Failed to save pipeline: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

export const getPipelines = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch pipelines")
    }

    const q = query(collection(db, "pipelines"), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        geometry: typeof data.geometry === 'string' ? JSON.parse(data.geometry) : data.geometry,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as PipelineData
    })
  } catch (error: any) {
    console.error("Error in getPipelines:", error)
    
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to access pipelines. Please check your authentication.")
    } else if (error.code === 'unavailable') {
      throw new Error("Service is temporarily unavailable. Please try again later.")
    } else {
      throw new Error(`Failed to fetch pipelines: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

export const updatePipeline = async (id: string, data: Partial<PipelineData>) => {
  try {
    if (!id) {
      throw new Error("Pipeline ID is required for update")
    }

    const docRef = doc(db, "pipelines", id)
    await updateDoc(docRef, prepareUpdateData(data))
      } catch (error: any) {
      console.error("Error in updatePipeline:", error)
      
      if (error.code === 'permission-denied') {
        throw new Error("You don't have permission to update this pipeline.")
      } else if (error.code === 'not-found') {
        throw new Error("Pipeline not found. It may have been deleted.")
      } else if (error.message?.includes('Nested arrays are not supported')) {
        throw new Error("Invalid geometry data. Please try editing the feature again.")
      } else {
        throw new Error(`Failed to update pipeline: ${error.message || 'Unknown error occurred'}`)
      }
    }
}

export const deletePipeline = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Pipeline ID is required for deletion")
    }

    const docRef = doc(db, "pipelines", id)
    await deleteDoc(docRef)
  } catch (error: any) {
    console.error("Error in deletePipeline:", error)
    
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to delete this pipeline.")
    } else if (error.code === 'not-found') {
      throw new Error("Pipeline not found. It may have already been deleted.")
    } else {
      throw new Error(`Failed to delete pipeline: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

// Zone operations
export const saveZone = async (data: Omit<ZoneData, "id">) => {
  try {
    // Validate required fields
    if (!data.name || !data.userId) {
      throw new Error("Zone name and user ID are required")
    }

    if (!data.geometry) {
      throw new Error("Zone geometry is required")
    }

    const dataWithTimestamp = {
      ...data,
      geometry: convertGeometryForFirestore(data.geometry),
      createdAt: Timestamp.fromDate(data.createdAt as Date)
    }
    
    const docRef = await addDoc(collection(db, "zones"), dataWithTimestamp)
    return docRef.id
  } catch (error: any) {
    console.error("Error in saveZone:", error)
    
    // Provide user-friendly error messages
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to save zones. Please check your authentication.")
    } else if (error.code === 'unavailable') {
      throw new Error("Service is temporarily unavailable. Please try again later.")
    } else if (error.code === 'resource-exhausted') {
      throw new Error("Service quota exceeded. Please try again later.")
    } else {
      throw new Error(`Failed to save zone: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

export const getZones = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch zones")
    }

    const q = query(collection(db, "zones"), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        geometry: typeof data.geometry === 'string' ? JSON.parse(data.geometry) : data.geometry,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as ZoneData
    })
  } catch (error: any) {
    console.error("Error in getZones:", error)
    
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to access zones. Please check your authentication.")
    } else if (error.code === 'unavailable') {
      throw new Error("Service is temporarily unavailable. Please try again later.")
    } else {
      throw new Error(`Failed to fetch zones: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

export const updateZone = async (id: string, data: Partial<ZoneData>) => {
  try {
    if (!id) {
      throw new Error("Zone ID is required for update")
    }

    const docRef = doc(db, "zones", id)
    await updateDoc(docRef, prepareUpdateData(data))
      } catch (error: any) {
      console.error("Error in updateZone:", error)
      
      if (error.code === 'permission-denied') {
        throw new Error("You don't have permission to update this zone.")
      } else if (error.code === 'not-found') {
        throw new Error("Zone not found. It may have been deleted.")
      } else if (error.message?.includes('Nested arrays are not supported')) {
        throw new Error("Invalid geometry data. Please try editing the feature again.")
      } else {
        throw new Error(`Failed to update zone: ${error.message || 'Unknown error occurred'}`)
      }
    }
}

export const deleteZone = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Zone ID is required for deletion")
    }

    const docRef = doc(db, "zones", id)
    await deleteDoc(docRef)
  } catch (error: any) {
    console.error("Error in deleteZone:", error)
    
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to delete this zone.")
    } else if (error.code === 'not-found') {
      throw new Error("Zone not found. It may have already been deleted.")
    } else {
      throw new Error(`Failed to delete zone: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

// Marker operations
export const saveMarker = async (data: Omit<MarkerData, "id">) => {
  try {
    // Validate required fields
    if (!data.name || !data.userId) {
      throw new Error("Marker name and user ID are required")
    }

    if (!data.geometry) {
      throw new Error("Marker geometry is required")
    }

    const dataWithTimestamp = {
      ...data,
      geometry: convertGeometryForFirestore(data.geometry),
      createdAt: Timestamp.fromDate(data.createdAt as Date)
    }
    
    const docRef = await addDoc(collection(db, "markers"), dataWithTimestamp)
    return docRef.id
  } catch (error: any) {
    console.error("Error in saveMarker:", error)
    
    // Provide user-friendly error messages
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to save markers. Please check your authentication.")
    } else if (error.code === 'unavailable') {
      throw new Error("Service is temporarily unavailable. Please try again later.")
    } else if (error.code === 'resource-exhausted') {
      throw new Error("Service quota exceeded. Please try again later.")
    } else {
      throw new Error(`Failed to save marker: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

export const getMarkers = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error("User ID is required to fetch markers")
    }

    const q = query(collection(db, "markers"), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        geometry: typeof data.geometry === 'string' ? JSON.parse(data.geometry) : data.geometry,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as MarkerData
    })
  } catch (error: any) {
    console.error("Error in getMarkers:", error)
    
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to access markers. Please check your authentication.")
    } else if (error.code === 'unavailable') {
      throw new Error("Service is temporarily unavailable. Please try again later.")
    } else {
      throw new Error(`Failed to fetch markers: ${error.message || 'Unknown error occurred'}`)
    }
  }
}

export const updateMarker = async (id: string, data: Partial<MarkerData>) => {
  try {
    if (!id) {
      throw new Error("Marker ID is required for update")
    }

    const docRef = doc(db, "markers", id)
    await updateDoc(docRef, prepareUpdateData(data))
      } catch (error: any) {
      console.error("Error in updateMarker:", error)
      
      if (error.code === 'permission-denied') {
        throw new Error("You don't have permission to update this marker.")
      } else if (error.code === 'not-found') {
        throw new Error("Marker not found. It may have been deleted.")
      } else if (error.message?.includes('Nested arrays are not supported')) {
        throw new Error("Invalid geometry data. Please try editing the feature again.")
      } else {
        throw new Error(`Failed to update marker: ${error.message || 'Unknown error occurred'}`)
      }
    }
}

export const deleteMarker = async (id: string) => {
  try {
    if (!id) {
      throw new Error("Marker ID is required for deletion")
    }

    const docRef = doc(db, "markers", id)
    await deleteDoc(docRef)
  } catch (error: any) {
    console.error("Error in deleteMarker:", error)
    
    if (error.code === 'permission-denied') {
      throw new Error("You don't have permission to delete this marker.")
    } else if (error.code === 'not-found') {
      throw new Error("Marker not found. It may have already been deleted.")
    } else {
      throw new Error(`Failed to delete marker: ${error.message || 'Unknown error occurred'}`)
    }
  }
}
