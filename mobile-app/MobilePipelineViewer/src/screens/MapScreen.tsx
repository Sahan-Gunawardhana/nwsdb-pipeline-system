import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Polyline, Polygon, Marker, MapPressEvent } from 'react-native-maps';
import { getRiskColor, getZoneColor } from '../data/mockData';
import { convertCoordinateArrayForDisplay, getCoordinatesFromGeometry } from '../utils/coordinates';
import { addTransparency } from '../utils/colors';
import RepairForm from '../components/RepairForm';
import RepairList from '../components/RepairList';
import { RepairRecord, Coordinates, PipelineData, ZoneData, MarkerData } from '../types';

interface MapScreenProps {
  pipelines: PipelineData[];
  zones: ZoneData[];
  markers: MarkerData[];
  repairs: RepairRecord[];
  onRepairSubmit: (repairData: Omit<RepairRecord, 'id' | 'timestamp' | 'status'>) => void;
}

export default function MapScreen({ 
  pipelines, 
  zones, 
  markers, 
  repairs: initialRepairs, 
  onRepairSubmit 
}: MapScreenProps) {
  const [repairFormVisible, setRepairFormVisible] = useState(false);
  const [repairListVisible, setRepairListVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);
  const [repairs, setRepairs] = useState<RepairRecord[]>(initialRepairs);

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({
      latitude,
      longitude,
      accuracy: 10, // Default accuracy
    });
    setRepairFormVisible(true);
  };

  const handleRepairSubmit = (repairData: Omit<RepairRecord, 'id' | 'timestamp' | 'status'>) => {
    const newRepair: RepairRecord = {
      ...repairData,
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'pending',
    };
    
    setRepairs(prev => [...prev, newRepair]);
    onRepairSubmit(repairData);
    Alert.alert('Success', 'Repair report submitted successfully!');
  };

  // Update repairs when props change
  React.useEffect(() => {
    setRepairs(initialRepairs);
  }, [initialRepairs]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Pipeline Map</Text>
          <Text style={styles.subtitle}>
            {pipelines.length} Pipelines • {zones.length} Zones • {markers.length} Markers
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.repairButton}
          onPress={() => setRepairListVisible(true)}
        >
          <Text style={styles.repairButtonText}>Repairs ({repairs.length})</Text>
        </TouchableOpacity>
      </View>
      
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 6.9271, // Colombo center
          longitude: 79.8612,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={handleMapPress}
      >
        {/* Render Pipelines as Polylines */}
        {pipelines.map((pipeline) => {
          const coordinates = getCoordinatesFromGeometry(pipeline.geometry);
          if (coordinates.length === 0) return null;
          
          const displayCoords = convertCoordinateArrayForDisplay(coordinates);
          
          return (
            <Polyline
              key={pipeline.id}
              coordinates={displayCoords}
              strokeColor={getRiskColor(pipeline.riskScore)}
              strokeWidth={4}
            />
          );
        })}

        {/* Render Zones as Polygons */}
        {zones.map((zone) => {
          const coordinates = getCoordinatesFromGeometry(zone.geometry);
          if (coordinates.length === 0) return null;
          
          const displayCoords = convertCoordinateArrayForDisplay(coordinates);
          const zoneColor = getZoneColor(zone, pipelines);
          const fillColor = addTransparency(zoneColor, 0.4); // Increased opacity for better visibility
          
          return (
            <Polygon
              key={zone.id}
              coordinates={displayCoords}
              strokeColor={zoneColor}
              strokeWidth={3}
              fillColor={fillColor}
              tappable={true}
            />
          );
        })}

        {/* Render Markers */}
        {markers.map((marker) => {
          const coordinates = getCoordinatesFromGeometry(marker.geometry);
          if (coordinates.length === 0) return null;
          
          const [lat, lng] = convertCoordinateArrayForDisplay(coordinates)[0];
          
          return (
            <Marker
              key={marker.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={marker.name}
              description={marker.description}
            />
          );
        })}

        {/* Render Repair Markers */}
        {repairs.map((repair) => (
          <Marker
            key={repair.id}
            coordinate={{
              latitude: repair.location.latitude,
              longitude: repair.location.longitude,
            }}
            title={repair.repairType}
            description={repair.description}
            pinColor={repair.severity === 'critical' ? 'red' : repair.severity === 'high' ? 'orange' : 'yellow'}
          />
        ))}
      </MapView>

      {/* Repair Form Modal */}
      {selectedLocation && (
        <RepairForm
          visible={repairFormVisible}
          onClose={() => {
            setRepairFormVisible(false);
            setSelectedLocation(null);
          }}
          onSubmit={handleRepairSubmit}
          location={selectedLocation}
        />
      )}

      {/* Repair List Modal */}
      <RepairList
        visible={repairListVisible}
        onClose={() => setRepairListVisible(false)}
        repairs={repairs}
      />

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>
          Tap anywhere on the map to report a repair
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  repairButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  repairButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  map: {
    flex: 1,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});