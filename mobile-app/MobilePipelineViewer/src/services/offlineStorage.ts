import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { EnhancedRepairRecord, SyncResult, CachedData } from '../types/enhancements';
import { RepairRecord } from '../types';

const STORAGE_KEYS = {
  PENDING_REPAIRS: '@pipeline_app/pending_repairs',
  CACHED_DATA: '@pipeline_app/cached_data',
  SYNC_METADATA: '@pipeline_app/sync_metadata',
};

export class OfflineStorageService {
  
  // Generate a unique local ID for offline repairs
  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Store a repair for offline sync
  async storeRepair(repair: RepairRecord): Promise<void> {
    try {
      const enhancedRepair: EnhancedRepairRecord = {
        ...repair,
        localId: this.generateLocalId(),
        syncStatus: 'pending',
        syncAttempts: 0,
        id: repair.id || this.generateLocalId(),
      };

      const existingRepairs = await this.getPendingRepairs();
      const updatedRepairs = [...existingRepairs, enhancedRepair];
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_REPAIRS,
        JSON.stringify(updatedRepairs)
      );

      console.log('📱 Repair stored offline:', enhancedRepair.localId);
    } catch (error) {
      console.error('Failed to store repair offline:', error);
      throw error;
    }
  }

  // Get all pending repairs
  async getPendingRepairs(): Promise<EnhancedRepairRecord[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_REPAIRS);
      if (!stored) return [];

      const repairs: EnhancedRepairRecord[] = JSON.parse(stored);
      
      // Convert timestamp strings back to Date objects
      return repairs.map(repair => ({
        ...repair,
        timestamp: new Date(repair.timestamp),
        lastSyncAttempt: repair.lastSyncAttempt ? new Date(repair.lastSyncAttempt) : undefined,
      }));
    } catch (error) {
      console.error('Failed to get pending repairs:', error);
      return [];
    }
  }

  // Mark a repair as synced
  async markRepairAsSynced(localId: string): Promise<void> {
    try {
      const pendingRepairs = await this.getPendingRepairs();
      const updatedRepairs = pendingRepairs.map(repair => 
        repair.localId === localId 
          ? { ...repair, syncStatus: 'synced' as const }
          : repair
      );

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_REPAIRS,
        JSON.stringify(updatedRepairs)
      );
    } catch (error) {
      console.error('Failed to mark repair as synced:', error);
      throw error;
    }
  }

  // Mark a repair as failed
  async markRepairAsFailed(localId: string, error: string): Promise<void> {
    try {
      const pendingRepairs = await this.getPendingRepairs();
      const updatedRepairs = pendingRepairs.map(repair => 
        repair.localId === localId 
          ? { 
              ...repair, 
              syncStatus: 'failed' as const,
              syncAttempts: repair.syncAttempts + 1,
              lastSyncAttempt: new Date(),
              syncError: error,
            }
          : repair
      );

      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_REPAIRS,
        JSON.stringify(updatedRepairs)
      );
    } catch (error) {
      console.error('Failed to mark repair as failed:', error);
      throw error;
    }
  }

  // Sync pending repairs (placeholder - actual sync handled by NetworkProvider)
  async syncPendingRepairs(): Promise<SyncResult> {
    const pendingRepairs = await this.getPendingRepairs();
    const unsynced = pendingRepairs.filter(repair => repair.syncStatus === 'pending');
    
    // This is a placeholder - actual sync logic is in NetworkProvider
    return {
      successful: [],
      failed: unsynced,
      errors: [new Error('Sync should be handled by NetworkProvider')],
    };
  }

  // Clear synced repairs from storage
  async clearSyncedRepairs(): Promise<void> {
    try {
      const pendingRepairs = await this.getPendingRepairs();
      const unsyncedRepairs = pendingRepairs.filter(repair => repair.syncStatus !== 'synced');
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.PENDING_REPAIRS,
        JSON.stringify(unsyncedRepairs)
      );

      console.log(`🧹 Cleared ${pendingRepairs.length - unsyncedRepairs.length} synced repairs`);
    } catch (error) {
      console.error('Failed to clear synced repairs:', error);
      throw error;
    }
  }

  // Get cached data
  async getCachedData(): Promise<CachedData | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
      if (!stored) return null;

      const cached: CachedData = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return {
        ...cached,
        lastUpdated: new Date(cached.lastUpdated),
      };
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Update cached data
  async updateCache(data: CachedData): Promise<void> {
    try {
      const cacheData = {
        ...data,
        lastUpdated: new Date(),
      };

      await AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_DATA,
        JSON.stringify(cacheData)
      );

      console.log('💾 Cache updated successfully');
    } catch (error) {
      console.error('Failed to update cache:', error);
      throw error;
    }
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{
    pendingRepairs: number;
    cacheSize: number;
    totalSize: number;
  }> {
    try {
      const [pendingRepairs, cachedData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PENDING_REPAIRS),
        AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA),
      ]);

      const pendingSize = pendingRepairs ? pendingRepairs.length : 0;
      const cacheSize = cachedData ? cachedData.length : 0;

      const pendingCount = pendingRepairs ? JSON.parse(pendingRepairs).length : 0;

      return {
        pendingRepairs: pendingCount,
        cacheSize,
        totalSize: pendingSize + cacheSize,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { pendingRepairs: 0, cacheSize: 0, totalSize: 0 };
    }
  }

  // Clear all offline data (for debugging/reset)
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.PENDING_REPAIRS),
        AsyncStorage.removeItem(STORAGE_KEYS.CACHED_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.SYNC_METADATA),
      ]);

      console.log('🗑️ All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
      throw error;
    }
  }
}