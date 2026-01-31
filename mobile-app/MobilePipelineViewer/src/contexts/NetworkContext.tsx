import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NetworkStatus, NetworkContextType, EnhancedRepairRecord } from '../types/enhancements';
import { submitRepair } from '../services/firebaseService';
import { OfflineStorageService } from '../services/offlineStorage';

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: React.ReactNode;
}

// We'll use a callback to communicate with the snackbar
let showNetworkSnackbar: ((message: string, type: 'success' | 'error' | 'warning' | 'info') => void) | null = null;

export const setNetworkSnackbarCallback = (callback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void) => {
  showNetworkSnackbar = callback;
};

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    connectionType: 'unknown',
    isSlowConnection: false,
    syncInProgress: false,
  });
  
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const updateNetworkStatus = useCallback(async () => {
    const wasConnected = networkStatus.isConnected;
    
    try {
      // Test network connectivity with multiple fallbacks for reliability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Shorter timeout for better UX
      
      // Try multiple endpoints for better reliability
      const testUrls = [
        'https://www.google.com/generate_204', // Google's connectivity check
        'https://httpbin.org/status/200',
        'https://jsonplaceholder.typicode.com/posts/1'
      ];
      
      let isConnected = false;
      
      for (const url of testUrls) {
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache',
          });
          
          if (response.ok) {
            isConnected = true;
            break;
          }
        } catch (urlError) {
          // Continue to next URL
          continue;
        }
      }
      
      clearTimeout(timeoutId);

      setNetworkStatus(prev => ({
        ...prev,
        isConnected,
        connectionType: isConnected ? 'unknown' : 'none',
        isSlowConnection: false,
        lastConnectedTime: isConnected ? new Date() : prev.lastConnectedTime,
      }));

      // Show Material Design snackbar notifications for network changes
      if (isConnected && !wasConnected) {
        // Just came back online - show success with action
        showNetworkSnackbar?.('You\'re back online', 'success');
        setTimeout(() => {
          syncPendingData();
        }, 500); // Shorter delay for better UX
      } else if (!isConnected && wasConnected) {
        // Just went offline - show warning with helpful message
        showNetworkSnackbar?.('You\'re offline', 'warning');
      }
      
    } catch (error) {
      // Network is definitely offline
      setNetworkStatus(prev => ({
        ...prev,
        isConnected: false,
        connectionType: 'none',
        isSlowConnection: false,
      }));

      // Show offline notification only if we were previously online
      if (wasConnected) {
        showNetworkSnackbar?.('Connection lost', 'warning');
      }
    }
  }, [networkStatus.isConnected, syncPendingData]);

  const refreshNetworkStatus = useCallback(async () => {
    await updateNetworkStatus();
  }, [updateNetworkStatus]);

  const syncPendingData = useCallback(async () => {
    if (!networkStatus.isConnected || networkStatus.syncInProgress) {
      return;
    }

    setNetworkStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      const offlineStorage = new OfflineStorageService();
      const pendingRepairs = await offlineStorage.getPendingRepairs();
      
      if (pendingRepairs.length === 0) {
        setNetworkStatus(prev => ({ ...prev, syncInProgress: false }));
        return;
      }

      setPendingOperations(pendingRepairs.length);

      // Sync repairs one by one to handle individual failures
      let successCount = 0;
      let failureCount = 0;

      for (const repair of pendingRepairs) {
        try {
          await submitRepair({
            type: repair.repairType,
            description: repair.description,
            severity: repair.severity,
            userId: repair.reportedBy,
            location: repair.location,
          });
          
          // Mark as synced in local storage
          await offlineStorage.markRepairAsSynced((repair as EnhancedRepairRecord).localId || repair.id || '');
          successCount++;
        } catch (error) {
          console.error('Failed to sync repair:', error);
          failureCount++;
        }
      }

      setPendingOperations(0);
      setLastSyncTime(new Date());
      
      // Show Material Design sync result notifications
      if (successCount > 0 && failureCount === 0) {
        showNetworkSnackbar?.(`${successCount} repair${successCount > 1 ? 's' : ''} synced`, 'success');
      } else if (successCount > 0 && failureCount > 0) {
        showNetworkSnackbar?.(`${successCount} synced, ${failureCount} failed`, 'warning');
      } else if (failureCount > 0) {
        showNetworkSnackbar?.(`Sync failed for ${failureCount} repair${failureCount > 1 ? 's' : ''}`, 'error');
      }

    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setNetworkStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [networkStatus.isConnected, networkStatus.syncInProgress]);

  useEffect(() => {
    // Initial network status check
    refreshNetworkStatus();

    // Set up responsive network checking
    const interval = setInterval(() => {
      updateNetworkStatus();
    }, 3000); // Check every 3 seconds for better responsiveness

    return () => {
      clearInterval(interval);
    };
  }, [refreshNetworkStatus, updateNetworkStatus]);

  // Check for pending operations on mount
  useEffect(() => {
    const checkPendingOperations = async () => {
      try {
        const offlineStorage = new OfflineStorageService();
        const pendingRepairs = await offlineStorage.getPendingRepairs();
        setPendingOperations(pendingRepairs.length);
      } catch (error) {
        console.error('Failed to check pending operations:', error);
      }
    };

    checkPendingOperations();
  }, []);

  const contextValue: NetworkContextType = {
    networkStatus,
    refreshNetworkStatus,
    syncPendingData,
    pendingOperations,
    lastSyncTime,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};