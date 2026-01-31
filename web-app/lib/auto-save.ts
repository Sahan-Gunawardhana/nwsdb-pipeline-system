import { AutoSaveConfig, PendingSave } from './editing-types'
import { updatePipeline, updateZone, updateMarker } from './firestore'

/**
 * Auto-save manager for geographic feature editing
 * Handles debounced saves with retry logic and offline queuing
 */
export class GeometryAutoSaver {
  private config: AutoSaveConfig
  private saveQueue: Map<string, PendingSave> = new Map()
  private saveTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private isOnline: boolean = navigator.onLine

  constructor(config: Partial<AutoSaveConfig> = {}) {
    this.config = {
      debounceDelay: 2000,
      maxRetries: 3,
      retryDelay: 1000,
      enableOfflineQueue: true,
      ...config
    }

    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  /**
   * Queue a save operation with debouncing
   */
  queueSave(
    featureId: string, 
    featureType: 'pipeline' | 'zone' | 'marker',
    geometry: any
  ): void {
    // Clear existing timeout for this feature
    const existingTimeout = this.saveTimeouts.get(featureId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Create or update pending save
    const pendingSave: PendingSave = {
      featureId,
      featureType,
      geometry,
      timestamp: new Date(),
      retryCount: 0
    }

    this.saveQueue.set(featureId, pendingSave)

    // Set new debounced timeout
    const timeout = setTimeout(() => {
      this.processSave(featureId)
    }, this.config.debounceDelay)

    this.saveTimeouts.set(featureId, timeout)
  }

  /**
   * Process a single save operation
   */
  private async processSave(featureId: string): Promise<void> {
    const pendingSave = this.saveQueue.get(featureId)
    if (!pendingSave) return

    try {
      // If offline and offline queue is disabled, skip
      if (!this.isOnline && !this.config.enableOfflineQueue) {
        console.warn('Offline and offline queue disabled, skipping save')
        return
      }

      // If offline but queue is enabled, keep in queue for later
      if (!this.isOnline) {
        console.log('Offline, keeping save in queue for later sync')
        return
      }

      await this.executeSave(pendingSave)
      
      // Success - remove from queue
      this.saveQueue.delete(featureId)
      this.saveTimeouts.delete(featureId)
      
      console.log(`Successfully saved ${pendingSave.featureType} ${featureId}`)
      
      // Dispatch success event
      this.dispatchSaveEvent('success', featureId, pendingSave.featureType)

    } catch (error) {
      console.error(`Error saving ${pendingSave.featureType} ${featureId}:`, error)
      await this.handleSaveError(error as Error, featureId)
    }
  }

  /**
   * Execute the actual save operation
   */
  private async executeSave(pendingSave: PendingSave): Promise<void> {
    const { featureId, featureType, geometry } = pendingSave

    // Convert geometry to the format expected by existing Firestore functions
    const updateData = { geometry }

    switch (featureType) {
      case 'pipeline':
        await updatePipeline(featureId, updateData)
        break
      case 'zone':
        await updateZone(featureId, updateData)
        break
      case 'marker':
        await updateMarker(featureId, updateData)
        break
      default:
        throw new Error(`Unknown feature type: ${featureType}`)
    }
  }

  /**
   * Handle save errors with retry logic
   */
  private async handleSaveError(error: Error, featureId: string): Promise<void> {
    const pendingSave = this.saveQueue.get(featureId)
    if (!pendingSave) return

    pendingSave.retryCount++

    // If we've exceeded max retries, give up
    if (pendingSave.retryCount >= this.config.maxRetries) {
      console.error(`Max retries exceeded for ${pendingSave.featureType} ${featureId}`)
      
      // Dispatch error event
      this.dispatchSaveEvent('error', featureId, pendingSave.featureType, error)
      
      // Keep in queue for manual retry or offline sync
      return
    }

    // Schedule retry with exponential backoff
    const retryDelay = this.config.retryDelay * Math.pow(2, pendingSave.retryCount - 1)
    
    console.log(`Retrying save for ${pendingSave.featureType} ${featureId} in ${retryDelay}ms (attempt ${pendingSave.retryCount})`)
    
    setTimeout(() => {
      this.processSave(featureId)
    }, retryDelay)
  }

  /**
   * Process all queued saves (useful when coming back online)
   */
  async processSaveQueue(): Promise<void> {
    if (!this.isOnline) return

    const savePromises = Array.from(this.saveQueue.keys()).map(featureId => 
      this.processSave(featureId)
    )

    await Promise.allSettled(savePromises)
  }

  /**
   * Handle coming back online
   */
  private handleOnline(): void {
    console.log('Connection restored, processing queued saves')
    this.isOnline = true
    this.processSaveQueue()
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    console.log('Connection lost, queuing saves for later')
    this.isOnline = false
  }

  /**
   * Get pending saves (useful for UI feedback)
   */
  getPendingSaves(): PendingSave[] {
    return Array.from(this.saveQueue.values())
  }

  /**
   * Check if a feature has pending changes
   */
  hasPendingChanges(featureId: string): boolean {
    return this.saveQueue.has(featureId)
  }

  /**
   * Cancel pending save for a feature
   */
  cancelSave(featureId: string): void {
    const timeout = this.saveTimeouts.get(featureId)
    if (timeout) {
      clearTimeout(timeout)
      this.saveTimeouts.delete(featureId)
    }
    this.saveQueue.delete(featureId)
  }

  /**
   * Force save a feature immediately (bypass debouncing)
   */
  async forceSave(featureId: string): Promise<void> {
    const timeout = this.saveTimeouts.get(featureId)
    if (timeout) {
      clearTimeout(timeout)
      this.saveTimeouts.delete(featureId)
    }
    
    await this.processSave(featureId)
  }

  /**
   * Dispatch custom events for save operations
   */
  private dispatchSaveEvent(
    type: 'success' | 'error' | 'retry',
    featureId: string,
    featureType: string,
    error?: Error
  ): void {
    const event = new CustomEvent('geometryAutoSave', {
      detail: {
        type,
        featureId,
        featureType,
        error: error?.message,
        timestamp: new Date()
      }
    })
    
    window.dispatchEvent(event)
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all timeouts
    this.saveTimeouts.forEach(timeout => clearTimeout(timeout))
    this.saveTimeouts.clear()
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    
    // Clear queue
    this.saveQueue.clear()
  }
}

// Global auto-saver instance
let globalAutoSaver: GeometryAutoSaver | null = null

/**
 * Get or create the global auto-saver instance
 */
export function getAutoSaver(config?: Partial<AutoSaveConfig>): GeometryAutoSaver {
  if (!globalAutoSaver) {
    globalAutoSaver = new GeometryAutoSaver(config)
  }
  return globalAutoSaver
}

/**
 * Hook for React components to use auto-save functionality
 */
export function useAutoSave() {
  const autoSaver = getAutoSaver()
  
  return {
    queueSave: autoSaver.queueSave.bind(autoSaver),
    forceSave: autoSaver.forceSave.bind(autoSaver),
    cancelSave: autoSaver.cancelSave.bind(autoSaver),
    hasPendingChanges: autoSaver.hasPendingChanges.bind(autoSaver),
    getPendingSaves: autoSaver.getPendingSaves.bind(autoSaver)
  }
}