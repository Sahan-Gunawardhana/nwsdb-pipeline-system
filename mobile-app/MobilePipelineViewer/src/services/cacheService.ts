import AsyncStorage from '@react-native-async-storage/async-storage';
import { PipelineData, ZoneData, MarkerData, RepairRecord } from '../types';

interface CacheData {
  pipelines: PipelineData[];
  zones: ZoneData[];
  markers: MarkerData[];
  repairs: RepairRecord[];
  lastUpdated: string;
  version: number;
}

interface CacheMetadata {
  lastFetch: string;
  dataVersion: number;
  hasInitialData: boolean;
}

const CACHE_KEYS = {
  DATA: '@pipeline_app/cached_data',
  METADATA: '@pipeline_app/cache_metadata',
};

const CACHE_VERSION = 1;
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

export class CacheService {
  
  // Check if we have valid cached data
  async hasCachedData(): Promise<boolean> {
    try {
      const metadata = await this.getCacheMetadata();
      return metadata.hasInitialData;
    } catch (error) {
      console.error('Error checking cached data:', error);
      return false;
    }
  }

  // Check if cache is still valid (not expired)
  async isCacheValid(): Promise<boolean> {
    try {
      const metadata = await this.getCacheMetadata();
      if (!metadata.hasInitialData) return false;

      const lastFetch = new Date(metadata.lastFetch);
      const now = new Date();
      const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);
      
      return hoursSinceLastFetch < CACHE_EXPIRY_HOURS;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  }

  // Get cached data
  async getCachedData(): Promise<CacheData | null> {
    try {
      const cachedDataString = await AsyncStorage.getItem(CACHE_KEYS.DATA);
      if (!cachedDataString) return null;

      const cachedData: CacheData = JSON.parse(cachedDataString);
      
      // Convert date strings back to Date objects
      cachedData.pipelines = cachedData.pipelines.map(p => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
      
      cachedData.zones = cachedData.zones.map(z => ({
        ...z,
        createdAt: new Date(z.createdAt),
      }));
      
      cachedData.markers = cachedData.markers.map(m => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
      
      cachedData.repairs = cachedData.repairs.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp),
      }));

      return cachedData;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Store data in cache
  async setCachedData(data: {
    pipelines: PipelineData[];
    zones: ZoneData[];
    markers: MarkerData[];
    repairs: RepairRecord[];
  }): Promise<void> {
    try {
      const cacheData: CacheData = {
        ...data,
        lastUpdated: new Date().toISOString(),
        version: CACHE_VERSION,
      };

      await AsyncStorage.setItem(CACHE_KEYS.DATA, JSON.stringify(cacheData));
      
      // Update metadata
      const metadata: CacheMetadata = {
        lastFetch: new Date().toISOString(),
        dataVersion: CACHE_VERSION,
        hasInitialData: true,
      };
      
      await AsyncStorage.setItem(CACHE_KEYS.METADATA, JSON.stringify(metadata));
      
      console.log('📦 Data cached successfully');
    } catch (error) {
      console.error('Error caching data:', error);
      throw error;
    }
  }

  // Get cache metadata
  private async getCacheMetadata(): Promise<CacheMetadata> {
    try {
      const metadataString = await AsyncStorage.getItem(CACHE_KEYS.METADATA);
      if (!metadataString) {
        return {
          lastFetch: new Date(0).toISOString(),
          dataVersion: 0,
          hasInitialData: false,
        };
      }

      return JSON.parse(metadataString);
    } catch (error) {
      console.error('Error getting cache metadata:', error);
      return {
        lastFetch: new Date(0).toISOString(),
        dataVersion: 0,
        hasInitialData: false,
      };
    }
  }

  // Clear all cached data
  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(CACHE_KEYS.DATA),
        AsyncStorage.removeItem(CACHE_KEYS.METADATA),
      ]);
      console.log('🗑️ Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    hasData: boolean;
    lastUpdated: Date | null;
    isValid: boolean;
    itemCounts: {
      pipelines: number;
      zones: number;
      markers: number;
      repairs: number;
    };
  }> {
    try {
      const cachedData = await this.getCachedData();
      const metadata = await this.getCacheMetadata();
      const isValid = await this.isCacheValid();

      return {
        hasData: metadata.hasInitialData,
        lastUpdated: metadata.hasInitialData ? new Date(metadata.lastFetch) : null,
        isValid,
        itemCounts: cachedData ? {
          pipelines: cachedData.pipelines.length,
          zones: cachedData.zones.length,
          markers: cachedData.markers.length,
          repairs: cachedData.repairs.length,
        } : {
          pipelines: 0,
          zones: 0,
          markers: 0,
          repairs: 0,
        },
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        hasData: false,
        lastUpdated: null,
        isValid: false,
        itemCounts: { pipelines: 0, zones: 0, markers: 0, repairs: 0 },
      };
    }
  }
}