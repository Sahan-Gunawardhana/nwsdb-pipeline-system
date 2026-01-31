import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { ZoneData } from '../types';
import { getZoneColor, mockPipelines } from '../data/mockData';

interface ZonePopupProps {
  zone: ZoneData | null;
  visible: boolean;
  onClose: () => void;
}

export default function ZonePopup({ zone, visible, onClose }: ZonePopupProps) {
  if (!zone) return null;

  const supplyEfficiency = ((zone.averageSupply / zone.averageConsumption) * 100).toFixed(1);
  const populationDensity = (zone.population / zone.squareKilometers).toFixed(0);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={[styles.header, { borderLeftColor: getZoneColor(zone, mockPipelines) }]}>
            <Text style={styles.title}>{zone.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Population & Infrastructure</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Houses:</Text>
                <Text style={styles.value}>{zone.houses.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Water Meters:</Text>
                <Text style={styles.value}>{zone.meters.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Population:</Text>
                <Text style={styles.value}>{zone.population.toLocaleString()}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Area:</Text>
                <Text style={styles.value}>{zone.squareKilometers} km²</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Water Consumption</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Avg Supply:</Text>
                <Text style={styles.value}>{zone.averageSupply.toLocaleString()} L/day</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Avg Consumption:</Text>
                <Text style={styles.value}>{zone.averageConsumption.toLocaleString()} L/day</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Flow Rate:</Text>
                <Text style={styles.value}>{zone.cubicMetersPerDay.toLocaleString()} m³/day</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics</Text>
              <View style={styles.analyticsContainer}>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{supplyEfficiency}%</Text>
                  <Text style={styles.analyticsLabel}>Supply Efficiency</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{populationDensity}</Text>
                  <Text style={styles.analyticsLabel}>People/km²</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Per Capita Consumption</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Per Person:</Text>
                <Text style={styles.value}>
                  {(zone.averageConsumption / zone.population).toFixed(1)} L/day
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Per House:</Text>
                <Text style={styles.value}>
                  {(zone.averageConsumption / zone.houses).toFixed(1)} L/day
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  popup: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    width: 120,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  analyticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  analyticsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
});