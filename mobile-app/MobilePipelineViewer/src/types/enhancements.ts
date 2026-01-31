// Enhanced types for mobile app improvements

export interface NetworkStatus {
  isConnected: boolean;
  connectionType: 'wifi' | 'cellular' | 'none' | 'unknown';
  isSlowConnection: boolean;
  lastConnectedTime?: Date;
  syncInProgress: boolean;
}

export interface NetworkContextType {
  networkStatus: NetworkStatus;
  refreshNetworkStatus: () => Promise<void>;
  syncPendingData: () => Promise<void>;
  pendingOperations: number;
  lastSyncTime: Date | null;
}

export interface SnackbarMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
  persistent: boolean;
  action?: SnackbarAction;
  timestamp: Date;
}

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarContextType {
  messages: SnackbarMessage[];
  showSnackbar: (message: string, type: SnackbarMessage['type'], options?: SnackbarOptions) => void;
  hideSnackbar: (id: string) => void;
  clearAll: () => void;
}

export interface SnackbarOptions {
  duration?: number;
  persistent?: boolean;
  action?: SnackbarAction;
}

export interface SyncResult {
  successful: RepairRecord[];
  failed: RepairRecord[];
  errors: Error[];
}

export interface OfflineStorageService {
  storeRepair(repair: RepairRecord): Promise<void>;
  getPendingRepairs(): Promise<RepairRecord[]>;
  syncPendingRepairs(): Promise<SyncResult>;
  clearSyncedRepairs(): Promise<void>;
  getCachedData(): Promise<CachedData>;
  updateCache(data: CachedData): Promise<void>;
}

export interface CachedData {
  pipelines: PipelineData[];
  zones: ZoneData[];
  markers: MarkerData[];
  lastUpdated: Date;
}

export interface EnhancedRepairRecord extends RepairRecord {
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  localId: string;
  syncAttempts: number;
  lastSyncAttempt?: Date;
  syncError?: string;
}

// Re-export existing types for convenience
export type { RepairRecord, PipelineData, ZoneData, MarkerData, Coordinates } from './index';