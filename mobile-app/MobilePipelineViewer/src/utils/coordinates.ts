import { Coordinates } from '../types';

/**
 * Convert coordinates from [longitude, latitude] format (storage) 
 * to [latitude, longitude] format (display)
 */
export const convertCoordinatesForDisplay = (coords: number[]): [number, number] => {
  if (!coords || coords.length < 2) {
    throw new Error('Invalid coordinates array');
  }
  return [coords[1], coords[0]]; // [lng, lat] -> [lat, lng]
};

/**
 * Convert coordinate arrays for polylines/polygons
 */
export const convertCoordinateArrayForDisplay = (coordsArray: number[][]): [number, number][] => {
  return coordsArray.map(coords => convertCoordinatesForDisplay(coords));
};

/**
 * Convert Coordinates object to array format for map display
 */
export const coordinatesToArray = (coords: Coordinates): [number, number] => {
  return [coords.latitude, coords.longitude];
};

/**
 * Convert array format to Coordinates object
 */
export const arrayToCoordinates = (coords: [number, number], accuracy?: number): Coordinates => {
  return {
    latitude: coords[0],
    longitude: coords[1],
    accuracy,
  };
};

/**
 * Parse geometry from mock data or Firebase string format
 */
export const parseGeometry = (geometry: string | any): any => {
  if (typeof geometry === 'string') {
    try {
      return JSON.parse(geometry);
    } catch (error) {
      console.error('Error parsing geometry string:', error);
      return null;
    }
  }
  return geometry;
};

/**
 * Get coordinates from geometry for different types
 */
export const getCoordinatesFromGeometry = (geometry: any): number[][] => {
  const parsed = parseGeometry(geometry);
  if (!parsed || !parsed.coordinates) return [];
  
  switch (parsed.type) {
    case 'Point':
      return [parsed.coordinates];
    case 'LineString':
      return parsed.coordinates;
    case 'Polygon':
      return parsed.coordinates[0]; // First ring of polygon
    default:
      return [];
  }
};