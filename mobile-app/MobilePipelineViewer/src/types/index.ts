// Core data types matching the web app structure

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface PipelineData {
  id?: string;
  geometry: string | any; // Can be string (stored) or object (parsed)
  name: string;
  startPosition: string;
  endPosition: string;
  material: string;
  diameter: number;
  soilNature: string;
  landscape: string;
  elevation: number;
  age: number;
  riskScore: number;
  createdAt: Date;
  userId: string;
}

export interface ZoneData {
  id?: string;
  geometry: string | any; // Can be string (stored) or object (parsed)
  name: string;
  houses: number;
  meters: number;
  population: number;
  averageSupply: number;
  averageConsumption: number;
  squareKilometers: number;
  cubicMetersPerDay: number;
  createdAt: Date;
  userId: string;
}

export interface MarkerData {
  id?: string;
  geometry: string | any; // Can be string (stored) or object (parsed)
  name: string;
  description: string;
  createdAt: Date;
  userId: string;
}

export interface RepairRecord {
  id?: string;
  location: Coordinates;
  locationAccuracy: number;
  repairType: string;
  category: string;
  description: string;
  additionalInfo?: string; // New field for extra information
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  timestamp: Date;
  photos?: string[];
  status: 'pending' | 'synced';
}

// Universal repair categories and types
export interface RepairCategories {
  [category: string]: string[];
}

export const REPAIR_CATEGORIES: RepairCategories = {
  'Pipeline Issues': [
    'Pipe Leak',
    'Pipe Burst',
    'Pipe Blockage',
    'Pipe Corrosion',
    'Joint Failure',
    'Other Pipeline Issue'
  ],
  'Valve Problems': [
    'Valve Leak',
    'Valve Stuck/Seized',
    'Valve Replacement Needed',
    'Valve Handle Missing',
    'Other Valve Issue'
  ],
  'Infrastructure': [
    'Meter Reading Issue',
    'Meter Replacement',
    'Manhole Cover Problem',
    'Access Point Issue',
    'Other Infrastructure Issue'
  ],
  'Water Quality': [
    'Discolored Water',
    'Low Water Pressure',
    'No Water Supply',
    'Water Contamination',
    'Other Quality Issue'
  ],
  'Emergency': [
    'Major Water Loss',
    'Service Interruption',
    'Safety Hazard',
    'Environmental Concern',
    'Other Emergency'
  ],
  'Maintenance': [
    'Routine Inspection',
    'Preventive Maintenance',
    'Equipment Servicing',
    'System Upgrade',
    'Other Maintenance'
  ]
};