import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { PipelineData } from '../types';
import { getRiskColor } from '../data/mockData';

interface PipelinePopupProps {
  pipeline: PipelineData | null;
  visible: boolean;
  onClose: () => void;
}

export default function PipelinePopup({ pipeline, visible, onClose }: PipelinePopupProps) {
  if (!pipeline) return null;

  const riskLevel = pipeline.riskScore > 0.7 ? 'High' : pipeline.riskScore > 0.4 ? 'Medium' : 'Low';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popup}>
          <View style={[styles.header, { borderLeftColor: getRiskColor(pipeline.riskScore) }]}>
            <Text style={styles.title}>{pipeline.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Route Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>From:</Text>
                <Text style={styles.value}>{pipeline.startPosition}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>To:</Text>
                <Text style={styles.value}>{pipeline.endPosition}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technical Specifications</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Material:</Text>
                <Text style={styles.value}>{pipeline.material}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Diameter:</Text>
                <Text style={styles.value}>{pipeline.diameter}mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Age:</Text>
                <Text style={styles.value}>{pipeline.age} years</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Environmental Conditions</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Soil Nature:</Text>
                <Text style={styles.value}>{pipeline.soilNature}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Landscape:</Text>
                <Text style={styles.value}>{pipeline.landscape}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Elevation:</Text>
                <Text style={styles.value}>{pipeline.elevation}m</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Risk Assessment</Text>
              <View style={styles.riskContainer}>
                <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(pipeline.riskScore) }]} />
                <View>
                  <Text style={styles.riskScore}>{pipeline.riskScore.toFixed(2)}</Text>
                  <Text style={styles.riskLevel}>{riskLevel} Risk</Text>
                </View>
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
    width: 100,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },
  riskScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  riskLevel: {
    fontSize: 14,
    color: '#666',
  },
});