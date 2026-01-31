import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// Fetch GeoJSON data from Firebase Storage
export const fetchGeoJSONFromStorage = async (filePath: string): Promise<any> => {
  try {
    const storageRef = ref(storage, filePath);
    const downloadURL = await getDownloadURL(storageRef);
    
    const response = await fetch(downloadURL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const geoJsonData = await response.json();
    return geoJsonData;
  } catch (error) {
    console.error(`Error fetching GeoJSON from ${filePath}:`, error);
    throw error;
  }
};

// Fetch all pipeline data from storage
export const fetchAllGeoJSONData = async () => {
  try {
    // Common GeoJSON file paths - adjust these based on your actual bucket structure
    const filePaths = [
      'geojson/pipelines.geojson',
      'geojson/zones.geojson', 
      'geojson/markers.geojson',
      'data/pipelines.json',
      'data/zones.json',
      'data/markers.json',
      'pipelines.geojson',
      'zones.geojson',
      'markers.geojson'
    ];

    const results = {
      pipelines: [],
      zones: [],
      markers: []
    };

    // Try different file paths to find the data
    for (const filePath of filePaths) {
      try {
        console.log(`Trying to fetch: ${filePath}`);
        const data = await fetchGeoJSONFromStorage(filePath);
        
        // Determine data type based on file name or content
        if (filePath.includes('pipeline')) {
          results.pipelines = processGeoJSONFeatures(data, 'pipeline');
        } else if (filePath.includes('zone')) {
          results.zones = processGeoJSONFeatures(data, 'zone');
        } else if (filePath.includes('marker')) {
          results.markers = processGeoJSONFeatures(data, 'marker');
        }
        
        console.log(`Successfully loaded: ${filePath}`);
      } catch (error) {
        console.log(`File not found: ${filePath}`);
        // Continue trying other paths
      }
    }

    return results;
  } catch (error) {
    console.error('Error fetching GeoJSON data:', error);
    throw error;
  }
};

// Process GeoJSON features into our data format
const processGeoJSONFeatures = (geoJsonData: any, type: string) => {
  if (!geoJsonData || !geoJsonData.features) {
    return [];
  }

  return geoJsonData.features.map((feature: any, index: number) => {
    const properties = feature.properties || {};
    
    // Create a standardized data structure
    const baseData = {
      id: properties.id || `${type}-${index}`,
      geometry: feature.geometry,
      name: properties.name || `${type} ${index + 1}`,
      createdAt: new Date(),
      userId: 'storage-data'
    };

    // Add type-specific properties
    if (type === 'pipeline') {
      return {
        ...baseData,
        startPosition: properties.startPosition || properties.start || 'Unknown',
        endPosition: properties.endPosition || properties.end || 'Unknown',
        material: properties.material || 'Unknown',
        diameter: properties.diameter || 100,
        soilNature: properties.soilNature || properties.soil || 'Unknown',
        landscape: properties.landscape || 'Unknown',
        elevation: properties.elevation || 0,
        age: properties.age || 10,
        riskScore: properties.riskScore || properties.risk || 0.5
      };
    } else if (type === 'zone') {
      return {
        ...baseData,
        houses: properties.houses || 100,
        meters: properties.meters || 90,
        population: properties.population || 400,
        averageSupply: properties.averageSupply || properties.supply || 500,
        averageConsumption: properties.averageConsumption || properties.consumption || 450,
        squareKilometers: properties.squareKilometers || properties.area || 1.0,
        cubicMetersPerDay: properties.cubicMetersPerDay || properties.flow || 800
      };
    } else if (type === 'marker') {
      return {
        ...baseData,
        description: properties.description || properties.desc || 'Infrastructure facility'
      };
    }

    return baseData;
  });
};

// List all files in storage (for debugging)
export const listStorageFiles = async (path: string = '') => {
  try {
    // Note: Firebase Storage doesn't have a direct list method in web SDK
    // This is mainly for debugging - you'd need to know the file paths
    console.log('Storage listing not available in web SDK');
    return [];
  } catch (error) {
    console.error('Error listing storage files:', error);
    return [];
  }
};