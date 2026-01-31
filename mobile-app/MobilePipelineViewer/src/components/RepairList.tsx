import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { RepairRecord } from '../types';
import RepairDetail from './RepairDetail';

interface RepairListProps {
  visible: boolean;
  onClose: () => void;
  repairs: RepairRecord[];
  onRepairPress?: (repair: RepairRecord) => void;
}

export default function RepairList({ visible, onClose, repairs, onRepairPress }: RepairListProps) {
  const [selectedRepair, setSelectedRepair] = useState<RepairRecord | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const handleRepairPress = (repair: RepairRecord) => {
    if (onRepairPress) {
      onRepairPress(repair);
    } else {
      setSelectedRepair(repair);
      setDetailVisible(true);
    }
  };
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderRepairItem = ({ item }: { item: RepairRecord }) => (
    <TouchableOpacity
      style={styles.repairItem}
      onPress={() => handleRepairPress(item)}
    >
      <View style={styles.repairHeader}>
        <View style={styles.repairTitleContainer}>
          <Text style={styles.repairType}>{item.repairType}</Text>
          <Text style={styles.repairCategory}>{item.category}</Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
            <Text style={styles.severityText}>{item.severity.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      
      {item.additionalInfo && (
        <Text style={styles.additionalInfo} numberOfLines={1}>
          Additional: {item.additionalInfo}
        </Text>
      )}
      
      <View style={styles.repairFooter}>
        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
        <Text style={styles.location}>
          {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.title}>Repair Records</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{repairs.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {repairs.filter(r => r.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {repairs.filter(r => r.severity === 'critical' || r.severity === 'high').length}
              </Text>
              <Text style={styles.statLabel}>High Priority</Text>
            </View>
          </View>

          <FlatList
            data={repairs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())}
            renderItem={renderRepairItem}
            keyExtractor={(item) => item.id || item.timestamp.toString()}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No repair records found</Text>
              </View>
            }
          />
        </View>

        {/* Repair Detail Modal */}
        <RepairDetail
          repair={selectedRepair}
          visible={detailVisible}
          onClose={() => {
            setDetailVisible(false);
            setSelectedRepair(null);
          }}
        />
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
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  repairItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: 'white',
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  repairTitleContainer: {
    flex: 1,
  },
  repairType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  repairCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  additionalInfo: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  repairFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  location: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});