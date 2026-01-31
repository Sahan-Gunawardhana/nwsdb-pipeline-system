import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';

interface NetworkStatusProps {
  compact?: boolean;
  showDetails?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  compact = false, 
  showDetails = false 
}) => {
  const { networkStatus, refreshNetworkStatus, pendingOperations, lastSyncTime } = useNetwork();

  const getStatusColor = () => {
    if (!networkStatus.isConnected) return '#F44336'; // Red
    if (networkStatus.isSlowConnection) return '#FF9800'; // Orange
    return '#4CAF50'; // Green
  };

  const getStatusText = () => {
    if (!networkStatus.isConnected) return 'Offline';
    if (networkStatus.syncInProgress) return 'Syncing...';
    if (networkStatus.isSlowConnection) return 'Slow Connection';
    return 'Online';
  };

  const getConnectionIcon = () => {
    if (!networkStatus.isConnected) return '📶❌';
    if (networkStatus.connectionType === 'wifi') return '📶';
    if (networkStatus.connectionType === 'cellular') return '📱';
    return '🌐';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        {pendingOperations > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingOperations}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={refreshNetworkStatus}
      activeOpacity={0.7}
    >
      <View style={styles.statusRow}>
        <Text style={styles.icon}>{getConnectionIcon()}</Text>
        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {showDetails && (
            <Text style={styles.detailText}>
              {networkStatus.connectionType.toUpperCase()}
            </Text>
          )}
        </View>
        
        {pendingOperations > 0 && (
          <View style={styles.pendingContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingOperations}</Text>
            </View>
            <Text style={styles.pendingText}>pending</Text>
          </View>
        )}
      </View>
      
      {showDetails && (
        <View style={styles.detailsRow}>
          <Text style={styles.lastSyncText}>
            Last sync: {formatLastSync()}
          </Text>
          {networkStatus.syncInProgress && (
            <View style={styles.syncIndicator}>
              <Text style={styles.syncText}>●</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -8,
    right: -8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pendingContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  pendingText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  lastSyncText: {
    fontSize: 10,
    color: '#666',
  },
  syncIndicator: {
    marginLeft: 8,
  },
  syncText: {
    fontSize: 12,
    color: '#2196F3',
    animation: 'pulse 1s infinite',
  },
});

export default NetworkStatus;