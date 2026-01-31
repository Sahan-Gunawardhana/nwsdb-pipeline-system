import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { RepairRecord } from '../types';

interface RepairDetailProps {
  repair: RepairRecord | null;
  visible: boolean;
  onClose: () => void;
}

export default function RepairDetail({ repair, visible, onClose }: RepairDetailProps) {
  if (!repair) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return '#16a34a';
      case 'pending': return '#d97706';
      default: return '#6b7280';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Repair Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status and Severity */}
            <View style={styles.badgeContainer}>
              <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(repair.severity) }]}>
                <Text style={styles.badgeText}>{repair.severity.toUpperCase()} PRIORITY</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(repair.status) }]}>
                <Text style={styles.badgeText}>{repair.status.toUpperCase()}</Text>
              </View>
            </View>

            {/* Main Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Issue Information</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Category:</Text>
                <Text style={styles.value}>{repair.category}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Type:</Text>
                <Text style={styles.value}>{repair.repairType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Reported:</Text>
                <Text style={styles.value}>{formatDate(repair.timestamp)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Reporter:</Text>
                <Text style={styles.value}>{repair.reportedBy}</Text>
              </View>
            </View>

            {/* Location Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Coordinates:</Text>
                <Text style={styles.locationValue}>
                  {repair.location.latitude.toFixed(6)}, {repair.location.longitude.toFixed(6)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Accuracy:</Text>
                <Text style={styles.value}>±{repair.locationAccuracy}m</Text>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{repair.description}</Text>
            </View>

            {/* Additional Information */}
            {repair.additionalInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Additional Information</Text>
                <Text style={styles.description}>{repair.additionalInfo}</Text>
              </View>
            )}

            {/* Photos Section (placeholder) */}
            {repair.photos && repair.photos.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Text style={styles.photoCount}>{repair.photos.length} photo(s) attached</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
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
  locationValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontFamily: 'monospace',
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});