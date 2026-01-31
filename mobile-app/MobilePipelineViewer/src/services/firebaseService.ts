import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PipelineData, ZoneData, MarkerData, RepairRecord } from '../types';

// Fetch all pipelines from Firebase (no user filtering for field app)
export const fetchPipelines = async (): Promise<PipelineData[]> => {
  try {
    console.log('🔍 Fetching all pipelines from Firebase...');
    const querySnapshot = await getDocs(collection(db, 'pipelines'));
    
    const pipelines = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        geometry: typeof data.geometry === 'string' ? JSON.parse(data.geometry) : data.geometry,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as PipelineData;
    });
    
    console.log(`📊 Found ${pipelines.length} pipelines`);
    return pipelines;
  } catch (error) {
    console.error('❌ Error fetching pipelines:', error);
    return [];
  }
};

// Fetch all zones from Firebase (no user filtering for field app)
export const fetchZones = async (): Promise<ZoneData[]> => {
  try {
    console.log('🔍 Fetching all zones from Firebase...');
    const querySnapshot = await getDocs(collection(db, 'zones'));
    
    const zones = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        geometry: typeof data.geometry === 'string' ? JSON.parse(data.geometry) : data.geometry,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as ZoneData;
    });
    
    console.log(`📊 Found ${zones.length} zones`);
    return zones;
  } catch (error) {
    console.error('❌ Error fetching zones:', error);
    return [];
  }
};

// Fetch all markers from Firebase (no user filtering for field app)
export const fetchMarkers = async (): Promise<MarkerData[]> => {
  try {
    console.log('🔍 Fetching all markers from Firebase...');
    const querySnapshot = await getDocs(collection(db, 'markers'));
    
    const markers = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        geometry: typeof data.geometry === 'string' ? JSON.parse(data.geometry) : data.geometry,
        createdAt: data.createdAt?.toDate?.() || data.createdAt
      } as MarkerData;
    });
    
    console.log(`📊 Found ${markers.length} markers`);
    return markers;
  } catch (error) {
    console.error('❌ Error fetching markers:', error);
    return [];
  }
};

// Fetch all data at once (optimized for mobile field app)
export const fetchAllPipelineData = async () => {
  try {
    console.log('🔍 Fetching all pipeline data...');
    
    const [pipelines, zones, markers] = await Promise.all([
      fetchPipelines(),
      fetchZones(),
      fetchMarkers()
    ]);
    
    const totalItems = pipelines.length + zones.length + markers.length;
    console.log(`📊 Successfully fetched ${totalItems} total items`);
    
    // Log user IDs found for debugging
    const userIds = new Set([
      ...pipelines.map(p => p.userId).filter(Boolean),
      ...zones.map(z => z.userId).filter(Boolean),
      ...markers.map(m => m.userId).filter(Boolean)
    ]);
    console.log('👥 User IDs found:', Array.from(userIds));
    
    return { pipelines, zones, markers };
  } catch (error) {
    console.error('❌ Error fetching all pipeline data:', error);
    throw error;
  }
};

// Submit repair to Firebase
export const submitRepair = async (repairData: {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  location?: { latitude: number; longitude: number; accuracy?: number };
}): Promise<string> => {
  try {
    console.log('🔧 Submitting repair to Firebase...', repairData);
    
    // Create repair document
    const repairDoc = {
      repairType: repairData.type,
      description: repairData.description,
      severity: repairData.severity,
      userId: repairData.userId,
      location: repairData.location || { latitude: 6.9271, longitude: 79.8612, accuracy: 10 }, // Default to Colombo if no location
      locationAccuracy: repairData.location?.accuracy || 10,
      reportedBy: 'Mobile App User',
      timestamp: serverTimestamp(),
      status: 'synced',
      createdAt: serverTimestamp(),
      // Create a GeoJSON point for the repair location to match web app format
      geometry: JSON.stringify({
        type: 'Point',
        coordinates: [
          repairData.location?.longitude || 79.8612,
          repairData.location?.latitude || 6.9271
        ]
      }),
      // Add as a marker so it appears on the web app map
      name: `${repairData.type} - ${repairData.severity.toUpperCase()}`,
    };
    
    // Add to repairs collection
    const repairRef = await addDoc(collection(db, 'repairs'), repairDoc);
    console.log('✅ Repair submitted with ID:', repairRef.id);
    
    // Also add as a marker so it appears on the web app map immediately
    const markerDoc = {
      name: `Repair: ${repairData.type}`,
      description: `${repairData.description}\n\nSeverity: ${repairData.severity.toUpperCase()}\nReported: ${new Date().toLocaleDateString()}`,
      geometry: JSON.stringify({
        type: 'Point',
        coordinates: [
          repairData.location?.longitude || 79.8612,
          repairData.location?.latitude || 6.9271
        ]
      }),
      userId: repairData.userId,
      createdAt: serverTimestamp(),
      type: 'repair',
      severity: repairData.severity,
      repairType: repairData.type,
    };
    
    const markerRef = await addDoc(collection(db, 'markers'), markerDoc);
    console.log('✅ Repair marker added with ID:', markerRef.id);
    
    return repairRef.id;
  } catch (error) {
    console.error('❌ Error submitting repair:', error);
    throw error;
  }
};

// Fetch all repairs from Firebase (field app sees all repairs)
export const fetchRepairs = async (): Promise<RepairRecord[]> => {
  try {
    console.log('🔍 Fetching all repairs from Firebase...');
    const querySnapshot = await getDocs(collection(db, 'repairs'));
    
    const repairs = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        location: data.location || { latitude: 0, longitude: 0, accuracy: 10 },
        locationAccuracy: data.locationAccuracy || 10,
        category: data.category || 'General',
        repairType: data.repairType || data.type || 'Unknown',
        description: data.description || '',
        additionalInfo: data.additionalInfo,
        severity: data.severity || 'medium',
        reportedBy: data.reportedBy || data.userId || 'Unknown',
        timestamp: data.timestamp?.toDate?.() || data.timestamp || new Date(),
        status: data.status || 'pending',
        ...data,
      } as RepairRecord;
    });
    
    console.log(`📊 Found ${repairs.length} repairs`);
    return repairs;
  } catch (error) {
    console.error('❌ Error fetching repairs:', error);
    return [];
  }
};