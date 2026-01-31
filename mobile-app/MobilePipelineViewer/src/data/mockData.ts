import { PipelineData, ZoneData, MarkerData, RepairRecord } from '../types';

// Mock pipeline data - using Colombo area coordinates
export const mockPipelines: PipelineData[] = [
  {
    id: '1',
    geometry: {
      type: 'LineString',
      coordinates: [
        [79.8612, 6.9271], // Colombo Fort
        [79.8650, 6.9200], // Pettah
        [79.8700, 6.9150], // Slave Island
      ]
    },
    name: 'Main Distribution Line A',
    startPosition: 'Colombo Fort Water Treatment Plant',
    endPosition: 'Slave Island Distribution Center',
    material: 'Cast Iron',
    diameter: 300,
    soilNature: 'Clay',
    landscape: 'Urban',
    elevation: 15,
    age: 25,
    riskScore: 0.7,
    createdAt: new Date('2023-01-15'),
    userId: 'mock-user-1'
  },
  {
    id: '2',
    geometry: {
      type: 'LineString',
      coordinates: [
        [79.8700, 6.9150], // Slave Island
        [79.8750, 6.9100], // Kollupitiya
        [79.8800, 6.9050], // Bambalapitiya
      ]
    },
    name: 'Secondary Line B',
    startPosition: 'Slave Island Distribution Center',
    endPosition: 'Bambalapitiya Reservoir',
    material: 'PVC',
    diameter: 200,
    soilNature: 'Sandy',
    landscape: 'Residential',
    elevation: 10,
    age: 15,
    riskScore: 0.3,
    createdAt: new Date('2023-02-20'),
    userId: 'mock-user-1'
  },
  {
    id: '3',
    geometry: {
      type: 'LineString',
      coordinates: [
        [79.8500, 6.9300], // Kotahena
        [79.8550, 6.9250], // Grandpass
        [79.8600, 6.9200], // Maradana
      ]
    },
    name: 'North Distribution Line C',
    startPosition: 'Kotahena Pumping Station',
    endPosition: 'Maradana Junction',
    material: 'Steel',
    diameter: 250,
    soilNature: 'Rocky',
    landscape: 'Industrial',
    elevation: 20,
    age: 35,
    riskScore: 0.8,
    createdAt: new Date('2023-03-10'),
    userId: 'mock-user-1'
  }
];

// Mock zone data
export const mockZones: ZoneData[] = [
  {
    id: '1',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.8500, 6.9400], // Northwest corner
        [79.8700, 6.9400], // Northeast corner
        [79.8700, 6.9200], // Southeast corner
        [79.8500, 6.9200], // Southwest corner
        [79.8500, 6.9400]  // Close polygon
      ]]
    },
    name: 'Colombo Central Zone',
    houses: 1250,
    meters: 1180,
    population: 4500,
    averageSupply: 850.5,
    averageConsumption: 780.2,
    squareKilometers: 2.5,
    cubicMetersPerDay: 1200.0,
    createdAt: new Date('2023-01-10'),
    userId: 'mock-user-1'
  },
  {
    id: '2',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.8700, 6.9200], // Northwest corner
        [79.8900, 6.9200], // Northeast corner
        [79.8900, 6.9000], // Southeast corner
        [79.8700, 6.9000], // Southwest corner
        [79.8700, 6.9200]  // Close polygon
      ]]
    },
    name: 'Kollupitiya Residential Zone',
    houses: 890,
    meters: 850,
    population: 3200,
    averageSupply: 650.0,
    averageConsumption: 590.5,
    squareKilometers: 1.8,
    cubicMetersPerDay: 900.0,
    createdAt: new Date('2023-02-15'),
    userId: 'mock-user-1'
  },
  {
    id: '3',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [79.8400, 6.9400], // Northwest corner
        [79.8500, 6.9400], // Northeast corner
        [79.8500, 6.9300], // Southeast corner
        [79.8400, 6.9300], // Southwest corner
        [79.8400, 6.9400]  // Close polygon
      ]]
    },
    name: 'Kotahena Industrial Zone',
    houses: 450,
    meters: 420,
    population: 1800,
    averageSupply: 1200.0,
    averageConsumption: 1150.0,
    squareKilometers: 1.2,
    cubicMetersPerDay: 1800.0,
    createdAt: new Date('2023-03-05'),
    userId: 'mock-user-1'
  }
];

// Mock marker data
export const mockMarkers: MarkerData[] = [
  {
    id: '1',
    geometry: {
      type: 'Point',
      coordinates: [79.8612, 6.9271] // Colombo Fort
    },
    name: 'Main Water Treatment Plant',
    description: 'Primary water treatment facility serving Colombo district',
    createdAt: new Date('2023-01-01'),
    userId: 'mock-user-1'
  },
  {
    id: '2',
    geometry: {
      type: 'Point',
      coordinates: [79.8750, 6.9100] // Kollupitiya
    },
    name: 'Kollupitiya Pumping Station',
    description: 'Secondary pumping station for residential areas',
    createdAt: new Date('2023-01-15'),
    userId: 'mock-user-1'
  },
  {
    id: '3',
    geometry: {
      type: 'Point',
      coordinates: [79.8500, 6.9300] // Kotahena
    },
    name: 'Kotahena Reservoir',
    description: 'Storage reservoir for industrial zone supply',
    createdAt: new Date('2023-02-01'),
    userId: 'mock-user-1'
  },
  {
    id: '4',
    geometry: {
      type: 'Point',
      coordinates: [79.8650, 6.9050] // Bambalapitiya
    },
    name: 'Emergency Valve Station',
    description: 'Critical valve control point for emergency shutoffs',
    createdAt: new Date('2023-02-20'),
    userId: 'mock-user-1'
  }
];

// Mock repair records (for testing repair form)
export const mockRepairs: RepairRecord[] = [
  {
    id: '1',
    location: {
      latitude: 6.9200,
      longitude: 79.8650,
      accuracy: 5
    },
    locationAccuracy: 5,
    category: 'Pipeline Issues',
    repairType: 'Pipe Leak',
    description: 'Small leak detected at joint connection. Temporary patch applied.',
    additionalInfo: 'Located near residential area, minimal traffic disruption',
    severity: 'medium',
    reportedBy: 'mock-user-1',
    timestamp: new Date('2023-12-15T10:30:00'),
    status: 'synced'
  },
  {
    id: '2',
    location: {
      latitude: 6.9150,
      longitude: 79.8700,
      accuracy: 8
    },
    locationAccuracy: 8,
    category: 'Valve Problems',
    repairType: 'Valve Replacement Needed',
    description: 'Old valve seized, requires replacement with new brass valve.',
    additionalInfo: 'Tools needed: pipe wrench, thread sealant, safety equipment',
    severity: 'high',
    reportedBy: 'mock-user-1',
    timestamp: new Date('2023-12-20T14:15:00'),
    status: 'pending'
  },
  {
    id: '3',
    location: {
      latitude: 6.9100,
      longitude: 79.8750,
      accuracy: 3
    },
    locationAccuracy: 3,
    category: 'Water Quality',
    repairType: 'Low Water Pressure',
    description: 'Residents reporting low water pressure in the area.',
    additionalInfo: 'Affects approximately 15 households, started yesterday morning',
    severity: 'medium',
    reportedBy: 'mock-user-1',
    timestamp: new Date('2023-12-22T09:45:00'),
    status: 'pending'
  }
];

// Helper function to get risk color (matching web app)
export const getRiskColor = (riskScore: number): string => {
  const red = Math.min(255, Math.floor(riskScore * 283));
  const green = Math.max(0, Math.floor(255 - riskScore * 283));
  return `rgb(${red}, ${green}, 0)`;
};

// Helper function to get zone color based on pipeline risk (matching web app)
export const getZoneColor = (zone: ZoneData, pipelines: PipelineData[]): string => {
  // Calculate risk based on pipelines within zone
  const zonePipelines = pipelines.filter((pipeline) => {
    // Simple point-in-polygon check (simplified for demo)
    // In production, implement proper spatial query
    return true; // For now, consider all pipelines
  });

  const highRiskCount = zonePipelines.filter((p) => p.riskScore > 0.6).length;
  const totalCount = zonePipelines.length;

  if (totalCount === 0) return '#94a3b8'; // Gray for no pipelines

  const riskRatio = highRiskCount / totalCount;
  return getRiskColor(riskRatio);
};