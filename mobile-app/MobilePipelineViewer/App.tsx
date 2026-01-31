import React, { useState, useEffect, createContext, useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, RefreshControl, ScrollView, useColorScheme, Switch } from 'react-native';
import { WebView } from 'react-native-webview';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchAllPipelineData, submitRepair as submitRepairToFirebase, fetchRepairs } from './src/services/firebaseService';
import { getCurrentLocation } from './src/services/locationService';
import { OfflineStorageService } from './src/services/offlineStorage';
import { CacheService } from './src/services/cacheService';
import { PipelineData, ZoneData, MarkerData, RepairRecord } from './src/types';

// Enhanced components
import { NetworkProvider, useNetwork, setNetworkSnackbarCallback } from './src/contexts/NetworkContext';
import { SnackbarProvider, useSnackbar } from './src/contexts/SnackbarContext';
import { NotificationProvider, useNotification } from './src/contexts/NotificationContext';
import { NotificationContainer } from './src/components/NotificationContainer';
import CustomSplashScreen from './src/components/SplashScreen';
import NetworkStatus from './src/components/NetworkStatus';

// Theme Context
type Theme = 'light' | 'dark' | 'system';
type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  colors: typeof lightColors;
};

const lightColors = {
  background: '#ffffff',
  foreground: '#0f172a',
  card: '#ffffff',
  cardForeground: '#0f172a',
  popover: '#ffffff',
  popoverForeground: '#0f172a',
  primary: '#0f172a',
  primaryForeground: '#f8fafc',
  secondary: '#f1f5f9',
  secondaryForeground: '#0f172a',
  muted: '#f1f5f9',
  mutedForeground: '#64748b',
  accent: '#f1f5f9',
  accentForeground: '#0f172a',
  destructive: '#ef4444',
  destructiveForeground: '#f8fafc',
  border: '#e2e8f0',
  input: '#e2e8f0',
  ring: '#94a3b8',
};

const darkColors = {
  background: '#0f172a',
  foreground: '#f8fafc',
  card: '#0f172a',
  cardForeground: '#f8fafc',
  popover: '#0f172a',
  popoverForeground: '#f8fafc',
  primary: '#f8fafc',
  primaryForeground: '#0f172a',
  secondary: '#1e293b',
  secondaryForeground: '#f8fafc',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  accent: '#1e293b',
  accentForeground: '#f8fafc',
  destructive: '#ef4444',
  destructiveForeground: '#f8fafc',
  border: '#1e293b',
  input: '#1e293b',
  ring: '#334155',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('system');
  
  const isDark = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Load theme from storage on app start
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const updateTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem('theme', newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

function AppContent() {
  const { colors, isDark, theme, setTheme } = useTheme();
  const { networkStatus, syncPendingData } = useNetwork();
  const { showSnackbar } = useSnackbar();
  const { showToast, showBanner } = useNotification();
  
  // Set up network snackbar callback
  useEffect(() => {
    setNetworkSnackbarCallback((message, type) => {
      showSnackbar(message, type);
    });
  }, [showSnackbar]);
  
  const [activeTab, setActiveTab] = useState<'map' | 'repairs' | 'settings'>('map');
  
  const handleTabChange = (tab: 'map' | 'repairs' | 'settings') => {
    setActiveTab(tab);
    
    // Only show contextual information for repairs tab if there are pending items
    if (tab === 'repairs') {
      const pendingCount = repairs.filter(r => r.status === 'pending').length;
      if (pendingCount > 0) {
        showSnackbar(`${pendingCount} repair${pendingCount > 1 ? 's' : ''} pending sync`, 'info');
      }
    }
  };
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cacheService] = useState(() => new CacheService());
  const [cacheStats, setCacheStats] = useState<{
    hasData: boolean;
    lastUpdated: Date | null;
    isValid: boolean;
  }>({ hasData: false, lastUpdated: null, isValid: false });

  // Helper function to format last update time
  const formatLastUpdate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairForm, setRepairForm] = useState({
    type: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    latitude: '',
    longitude: '',
    accuracy: 0,
    locationFetched: false,
  });

  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    autoRefresh: false,
    mapAttribution: false,
  });

  // Predefined repair types with descriptions
  const repairTypes = [
    { 
      id: 'pipe_leak_minor', 
      name: 'Minor Pipe Leak', 
      description: 'Small leak in pipeline causing minimal water loss',
      defaultSeverity: 'low' as const
    },
    { 
      id: 'pipe_leak_major', 
      name: 'Major Pipe Leak', 
      description: 'Significant leak causing substantial water loss and potential damage',
      defaultSeverity: 'high' as const
    },
    { 
      id: 'pipe_burst', 
      name: 'Pipe Burst', 
      description: 'Complete pipe failure with major water loss and service disruption',
      defaultSeverity: 'critical' as const
    },
    { 
      id: 'valve_malfunction', 
      name: 'Valve Malfunction', 
      description: 'Valve not operating properly, affecting water flow control',
      defaultSeverity: 'medium' as const
    },
    { 
      id: 'joint_leak', 
      name: 'Joint Leak', 
      description: 'Leak at pipe joint or connection point',
      defaultSeverity: 'medium' as const
    },
    { 
      id: 'meter_issue', 
      name: 'Water Meter Issue', 
      description: 'Problem with water meter reading or functionality',
      defaultSeverity: 'low' as const
    },
    { 
      id: 'pressure_drop', 
      name: 'Pressure Drop', 
      description: 'Significant reduction in water pressure affecting service',
      defaultSeverity: 'medium' as const
    },
    { 
      id: 'contamination', 
      name: 'Water Contamination', 
      description: 'Water quality issue requiring immediate attention',
      defaultSeverity: 'critical' as const
    },
    { 
      id: 'blockage', 
      name: 'Pipe Blockage', 
      description: 'Obstruction in pipeline affecting water flow',
      defaultSeverity: 'high' as const
    },
    { 
      id: 'other', 
      name: 'Other Issue', 
      description: 'Other pipeline or water system related issue',
      defaultSeverity: 'medium' as const
    }
  ];

  // Helper function to get severity color
  const getSeverityColor = (severity: string, colors: typeof lightColors) => {
    switch (severity) {
      case 'low': return '#10b981'; // green
      case 'medium': return '#f59e0b'; // yellow
      case 'high': return '#f97316'; // orange
      case 'critical': return '#ef4444'; // red
      default: return colors.primary;
    }
  };

  // Load data on startup - cache first approach
  useEffect(() => {
    console.log('🚀 App starting, loading data...');
    loadData(); // This will use cache if available, only fetch if needed
    loadSettings();
    
    // Welcome message after a short delay - use toast for brief confirmation
    setTimeout(() => {
      showToast('Pipeline Viewer ready', 'success', 1500);
    }, 2000);
  }, []);

  // Debug effect to log data state changes
  useEffect(() => {
    console.log(`📊 Data state updated: ${pipelines.length} pipelines, ${zones.length} zones, ${markers.length} markers, ${repairs.length} repairs`);
  }, [pipelines, zones, markers, repairs]);

  // Auto-refresh effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (settings.autoRefresh) {
      interval = setInterval(() => {
        if (networkStatus.isConnected) {
          loadData(true); // Force refresh for auto-refresh
        }
        // Don't show offline message for auto-refresh - too intrusive
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [settings.autoRefresh, networkStatus.isConnected]);

  // Load settings from storage
  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Save settings to storage
  const updateSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
      
      // Check for specific setting changes to provide contextual feedback
      if (settings.autoRefresh !== newSettings.autoRefresh) {
        if (newSettings.autoRefresh) {
          showToast('Auto-refresh enabled', 'success', 1500);
        } else {
          showToast('Auto-refresh disabled', 'info', 1200);
        }
      } else {
        showToast('Settings saved', 'success', 1200);
      }
      
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      showSnackbar('Failed to save settings', 'error');
    }
  };

  // Update cache stats
  const updateCacheStats = async () => {
    const stats = await cacheService.getCacheStats();
    setCacheStats({
      hasData: stats.hasData,
      lastUpdated: stats.lastUpdated,
      isValid: stats.isValid,
    });
  };

  // Main data loading function - cache first approach
  const loadData = async (forceRefresh: boolean = false) => {
    try {
      // If force refresh is requested, use refreshData (doesn't affect initial loading state)
      if (forceRefresh) {
        return await refreshData();
      }

      // Check if we have valid cached data
      const hasCached = await cacheService.hasCachedData();
      const isValid = await cacheService.isCacheValid();

      if (hasCached && isValid && !forceRefresh) {
        // Use cached data if available and valid
        const cachedData = await cacheService.getCachedData();
        if (cachedData) {
          setPipelines(cachedData.pipelines);
          setZones(cachedData.zones);
          setMarkers(cachedData.markers);
          setRepairs(cachedData.repairs);
          await updateCacheStats();
          
          const totalItems = cachedData.pipelines.length + cachedData.zones.length + 
                           cachedData.markers.length + cachedData.repairs.length;
          console.log(`📦 Loaded ${totalItems} items from cache`);
          
          // Important: Set loading to false when using cached data
          setLoading(false);
          return;
        }
      }

      // If no valid cache or first time, load fresh data (this manages loading state internally)
      await loadInitialData();
    } catch (error) {
      console.error('Error in loadData:', error);
      showSnackbar('Failed to load data', 'error');
      // Important: Set loading to false on error
      setLoading(false);
    }
  };

  // Initial data load - always fetch fresh data if online, cache it, then use cache
  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      if (networkStatus.isConnected) {
        // Fetch fresh data from Firebase on app launch
        const [data, repairsData] = await Promise.all([
          fetchAllPipelineData(),
          fetchRepairs()
        ]);
        
        // Check if we got any data from Firebase
        const hasFirebaseData = data.pipelines.length > 0 || data.zones.length > 0 || data.markers.length > 0;
        
        if (hasFirebaseData || repairsData.length > 0) {
          // Update state with fresh data
          setPipelines(data.pipelines);
          setZones(data.zones);
          setMarkers(data.markers);
          setRepairs(repairsData);
          
          // Cache the fresh data for future use
          await cacheService.setCachedData({
            pipelines: data.pipelines,
            zones: data.zones,
            markers: data.markers,
            repairs: repairsData,
          });
          
          await updateCacheStats();
          
          const totalItems = data.pipelines.length + data.zones.length + 
                           data.markers.length + repairsData.length;
          console.log(`📊 Loaded ${totalItems} items from Firebase and cached`);
        } else {
          // No data in Firebase, fall back to mock data for development
          console.log('🔄 No data found in Firebase, loading mock data for development');
          const { mockPipelines, mockZones, mockMarkers, mockRepairs } = await import('./src/data/mockData');
          
          setPipelines(mockPipelines);
          setZones(mockZones);
          setMarkers(mockMarkers);
          setRepairs(mockRepairs);
          
          // Cache the mock data
          await cacheService.setCachedData({
            pipelines: mockPipelines,
            zones: mockZones,
            markers: mockMarkers,
            repairs: mockRepairs,
          });
          
          await updateCacheStats();
          showToast('Loaded demo data', 'info', 2000);
        }
        
      } else {
        // If offline, try to load from cache
        const cachedData = await cacheService.getCachedData();
        if (cachedData) {
          setPipelines(cachedData.pipelines);
          setZones(cachedData.zones);
          setMarkers(cachedData.markers);
          setRepairs(cachedData.repairs);
          
          const totalItems = cachedData.pipelines.length + cachedData.zones.length + 
                           cachedData.markers.length + cachedData.repairs.length;
          showToast(`Loaded ${totalItems} items from cache`, 'info', 1500);
          await updateCacheStats();
        } else {
          // No cache and offline, load mock data
          console.log('📱 Offline with no cache, loading mock data');
          const { mockPipelines, mockZones, mockMarkers, mockRepairs } = await import('./src/data/mockData');
          
          setPipelines(mockPipelines);
          setZones(mockZones);
          setMarkers(mockMarkers);
          setRepairs(mockRepairs);
          
          showToast('Loaded demo data (offline)', 'warning', 2000);
        }
      }
      
    } catch (err: any) {
      console.error('Error loading initial data:', err);
      
      // Try to fall back to cache on error
      const cachedData = await cacheService.getCachedData();
      if (cachedData) {
        setPipelines(cachedData.pipelines);
        setZones(cachedData.zones);
        setMarkers(cachedData.markers);
        setRepairs(cachedData.repairs);
        showToast('Loaded cached data', 'warning', 1500);
        await updateCacheStats();
      } else {
        // Last resort: load mock data
        console.log('🚨 Error loading data, falling back to mock data');
        try {
          const { mockPipelines, mockZones, mockMarkers, mockRepairs } = await import('./src/data/mockData');
          
          setPipelines(mockPipelines);
          setZones(mockZones);
          setMarkers(mockMarkers);
          setRepairs(mockRepairs);
          
          showToast('Loaded demo data (fallback)', 'error', 2500);
        } catch (mockError) {
          console.error('Failed to load mock data:', mockError);
          showSnackbar('Failed to load any data', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh - only called when user taps refresh button
  const refreshData = async () => {
    if (!networkStatus.isConnected) {
      showSnackbar('No internet connection', 'warning');
      return;
    }

    try {
      setRefreshing(true);
      showToast('Refreshing data...', 'info', 1000);
      
      const [data, repairsData] = await Promise.all([
        fetchAllPipelineData(),
        fetchRepairs()
      ]);
      
      // Update state
      setPipelines(data.pipelines);
      setZones(data.zones);
      setMarkers(data.markers);
      setRepairs(repairsData);
      
      // Update cache
      await cacheService.setCachedData({
        pipelines: data.pipelines,
        zones: data.zones,
        markers: data.markers,
        repairs: repairsData,
      });
      
      await updateCacheStats();
      
      const totalItems = data.pipelines.length + data.zones.length + 
                       data.markers.length + repairsData.length;
      showToast(`Data refreshed • ${totalItems} items`, 'success', 1500);
      
    } catch (err: any) {
      console.error('Error refreshing data:', err);
      showSnackbar('Failed to refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch current location for repair form
  const fetchCurrentLocation = async () => {
    try {
      showToast('Getting location...', 'info', 1000);
      const location = await getCurrentLocation();
      if (location) {
        setRepairForm(prev => ({
          ...prev,
          latitude: location.latitude.toFixed(6),
          longitude: location.longitude.toFixed(6),
          accuracy: location.accuracy,
          locationFetched: true,
        }));
        showToast(`Location found • ±${location.accuracy}m`, 'success', 1500);
      } else {
        showSnackbar('Unable to get location', 'error');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      showSnackbar('Location access denied', 'error');
    }
  };

  // Open repair modal and fetch location
  const openRepairModal = () => {
    setShowRepairModal(true);
    // Reset form and fetch location
    setRepairForm({
      type: '',
      description: '',
      severity: 'medium',
      latitude: '',
      longitude: '',
      accuracy: 0,
      locationFetched: false,
    });
    
    // Show helpful message about repair logging
    if (!networkStatus.isConnected) {
      showBanner('Working offline', 'warning', {
        persistent: false,
      });
    }
    
    // Fetch location after a short delay to ensure modal is open
    setTimeout(() => {
      fetchCurrentLocation();
    }, 500);
  };

  const submitRepair = async () => {
    if (!repairForm.type || !repairForm.description) {
      showSnackbar('Please fill in all fields', 'error');
      return;
    }

    if (!repairForm.latitude || !repairForm.longitude) {
      showSnackbar('Please provide location coordinates', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      const location = {
        latitude: parseFloat(repairForm.latitude),
        longitude: parseFloat(repairForm.longitude),
        accuracy: repairForm.accuracy || 10,
      };

      // Validate coordinates
      if (isNaN(location.latitude) || isNaN(location.longitude)) {
        showSnackbar('Please enter valid coordinates', 'error');
        return;
      }

      if (location.latitude < -90 || location.latitude > 90) {
        showSnackbar('Latitude must be between -90 and 90', 'error');
        return;
      }

      if (location.longitude < -180 || location.longitude > 180) {
        showSnackbar('Longitude must be between -180 and 180', 'error');
        return;
      }
      
      // Check if online or offline
      if (networkStatus.isConnected) {
        await submitRepairWithLocation(location);
      } else {
        await submitRepairOffline(location);
      }
    } catch (error) {
      console.error('Error submitting repair:', error);
      showSnackbar('Failed to submit repair. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitRepairOffline = async (location: { latitude: number; longitude: number; accuracy: number }) => {
    try {
      const offlineStorage = new OfflineStorageService();
      
      const repairRecord: RepairRecord = {
        id: `offline_${Date.now()}`,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
        },
        locationAccuracy: location.accuracy,
        category: 'Pipeline Issues', // Default category for now
        repairType: repairForm.type,
        description: repairForm.description,
        severity: repairForm.severity,
        reportedBy: 'mobile-field-app',
        timestamp: new Date(),
        status: 'pending',
      };

      await offlineStorage.storeRepair(repairRecord);
      
      showSnackbar('Repair saved offline', 'info', {
        duration: 6000,
        action: {
          label: 'SYNC',
          onPress: () => syncPendingData(),
        },
      });

      // Close modal and reset form
      setShowRepairModal(false);
      setRepairForm({ 
        type: '', 
        description: '', 
        severity: 'medium',
        latitude: '',
        longitude: '',
        accuracy: 0,
        locationFetched: false,
      });

      // Add to local repairs list for immediate display
      setRepairs(prev => [...prev, repairRecord]);
      
    } catch (error) {
      console.error('Error storing repair offline:', error);
      showSnackbar('Failed to save repair offline', 'error');
    }
  };

  const submitRepairWithLocation = async (location: { latitude: number; longitude: number; accuracy: number } | null) => {
    try {
      const repairId = await submitRepairToFirebase({
        type: repairForm.type,
        description: repairForm.description,
        severity: repairForm.severity,
        userId: 'mobile-field-app', // Generic user ID for mobile field app
        location: location || undefined,
      });
      
      showSnackbar('Repair submitted successfully', 'success');
      
      // Close modal and reset form
      setShowRepairModal(false);
      setRepairForm({ 
        type: '', 
        description: '', 
        severity: 'medium',
        latitude: '',
        longitude: '',
        accuracy: 0,
        locationFetched: false,
      });
      
      // Refresh data to show the new repair marker
      loadData(true);
    } catch (error) {
      console.error('Error submitting repair with location:', error);
      showSnackbar('Failed to submit repair. Please try again.', 'error');
    }
  };

  // Generate Leaflet HTML with data
  const generateLeafletHTML = () => {
    console.log(`🗺️ Generating map with: ${pipelines.length} pipelines, ${zones.length} zones, ${markers.length} markers, ${repairs.length} repairs`);
    
    const mapData = {
      pipelines: pipelines.map(p => ({
        id: p.id,
        name: p.name,
        geometry: typeof p.geometry === 'string' ? p.geometry : JSON.stringify(p.geometry),
        riskScore: p.riskScore,
        material: p.material,
        startPosition: p.startPosition,
        endPosition: p.endPosition
      })),
      zones: zones.map(z => ({
        id: z.id,
        name: z.name,
        geometry: typeof z.geometry === 'string' ? z.geometry : JSON.stringify(z.geometry),
        houses: z.houses,
        population: z.population
      })),
      markers: markers.map(m => ({
        id: m.id,
        name: m.name,
        geometry: typeof m.geometry === 'string' ? m.geometry : JSON.stringify(m.geometry),
        description: m.description
      })),
      repairs: repairs.map(r => ({
        id: r.id,
        repairType: r.repairType,
        description: r.description,
        severity: r.severity,
        status: r.status,
        timestamp: r.timestamp.toISOString(),
        location: r.location
      }))
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pipeline Map</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body { margin: 0; padding: 0; }
        #map { height: 100vh; width: 100vw; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        // Initialize map centered on Colombo
        var map = L.map('map').setView([6.9271, 79.8612], 13);
        
        // Add OpenStreetMap tiles without attribution
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: ''
        }).addTo(map);
        
        // Remove Leaflet attribution control
        map.attributionControl.remove();

        // Data from React Native
        var mapData = ${JSON.stringify(mapData)};
        
        console.log('🗺️ Map data received:', mapData);
        console.log('📊 Data counts:', {
            pipelines: mapData.pipelines.length,
            zones: mapData.zones.length,
            markers: mapData.markers.length,
            repairs: mapData.repairs.length
        });
        
        // Function to get risk color
        function getRiskColor(riskScore) {
            var red = Math.min(255, Math.floor(riskScore * 283));
            var green = Math.max(0, Math.floor(255 - riskScore * 283));
            return 'rgb(' + red + ', ' + green + ', 0)';
        }
        
        // Add pipelines
        mapData.pipelines.forEach(function(pipeline) {
            try {
                var geometry = typeof pipeline.geometry === 'string' ? 
                    JSON.parse(pipeline.geometry) : pipeline.geometry;
                
                if (geometry && geometry.coordinates) {
                    var coords = geometry.coordinates.map(function(coord) {
                        return [coord[1], coord[0]]; // [lng, lat] -> [lat, lng]
                    });
                    
                    L.polyline(coords, {
                        color: getRiskColor(pipeline.riskScore || 0.5),
                        weight: 4,
                        opacity: 0.8
                    }).addTo(map).bindPopup(
                        '<b>' + pipeline.name + '</b><br>' +
                        'Material: ' + pipeline.material + '<br>' +
                        'Risk Score: ' + (pipeline.riskScore || 0).toFixed(2) + '<br>' +
                        'From: ' + pipeline.startPosition + '<br>' +
                        'To: ' + pipeline.endPosition
                    );
                }
            } catch (error) {
                console.error('Error rendering pipeline:', error);
            }
        });
        
        // Add zones
        mapData.zones.forEach(function(zone) {
            try {
                var geometry = typeof zone.geometry === 'string' ? 
                    JSON.parse(zone.geometry) : zone.geometry;
                
                if (geometry && geometry.coordinates && geometry.coordinates[0]) {
                    var coords = geometry.coordinates[0].map(function(coord) {
                        return [coord[1], coord[0]]; // [lng, lat] -> [lat, lng]
                    });
                    
                    L.polygon(coords, {
                        color: '#8b5cf6',
                        weight: 2,
                        fillColor: '#8b5cf6',
                        fillOpacity: 0.2
                    }).addTo(map).bindPopup(
                        '<b>' + zone.name + '</b><br>' +
                        'Houses: ' + zone.houses + '<br>' +
                        'Population: ' + zone.population
                    );
                }
            } catch (error) {
                console.error('Error rendering zone:', error);
            }
        });
        
        // Add markers
        mapData.markers.forEach(function(marker) {
            try {
                var geometry = typeof marker.geometry === 'string' ? 
                    JSON.parse(marker.geometry) : marker.geometry;
                
                if (geometry && geometry.coordinates) {
                    var coord = [geometry.coordinates[1], geometry.coordinates[0]]; // [lng, lat] -> [lat, lng]
                    
                    L.marker(coord).addTo(map).bindPopup(
                        '<b>' + marker.name + '</b><br>' +
                        marker.description
                    );
                }
            } catch (error) {
                console.error('Error rendering marker:', error);
            }
        });
        
        // Add repairs as markers
        mapData.repairs.forEach(function(repair) {
            try {
                if (repair.location && repair.location.latitude && repair.location.longitude) {
                    var coord = [repair.location.latitude, repair.location.longitude];
                    
                    // Create custom icon based on severity
                    var iconColor = '#3388ff'; // default blue
                    switch(repair.severity) {
                        case 'low': iconColor = '#28a745'; break;      // green
                        case 'medium': iconColor = '#ffc107'; break;   // yellow
                        case 'high': iconColor = '#fd7e14'; break;     // orange
                        case 'critical': iconColor = '#dc3545'; break; // red
                    }
                    
                    // Create a custom divIcon for repairs
                    var repairIcon = L.divIcon({
                        className: 'repair-marker',
                        html: '<div style="background-color: ' + iconColor + '; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });
                    
                    var statusText = repair.status === 'pending' ? ' (Pending Sync)' : '';
                    var timestamp = new Date(repair.timestamp).toLocaleDateString();
                    
                    L.marker(coord, { icon: repairIcon }).addTo(map).bindPopup(
                        '<b>🔧 ' + repair.repairType + '</b><br>' +
                        '<strong>Severity:</strong> ' + repair.severity.toUpperCase() + '<br>' +
                        '<strong>Status:</strong> ' + repair.status + statusText + '<br>' +
                        '<strong>Date:</strong> ' + timestamp + '<br>' +
                        '<strong>Description:</strong> ' + repair.description
                    );
                }
            } catch (error) {
                console.error('Error rendering repair:', error);
            }
        });
        
        // Fit map to show all data
        if (mapData.pipelines.length > 0 || mapData.zones.length > 0 || mapData.markers.length > 0) {
            try {
                var group = new L.FeatureGroup();
                // Add all layers to group for bounds calculation
                map.eachLayer(function(layer) {
                    if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Marker) {
                        group.addLayer(layer);
                    }
                });
                if (group.getLayers().length > 0) {
                    map.fitBounds(group.getBounds(), {padding: [20, 20]});
                }
            } catch (error) {
                console.error('Error fitting bounds:', error);
            }
        }
    </script>
</body>
</html>`;
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingScreen, { backgroundColor: colors.muted }]}>
          <View style={styles.loadingContent}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="map" size={32} color={colors.primaryForeground} />
              </View>
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Pipeline Viewer</Text>
            </View>
            <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
            <Text style={[styles.loadingSubtitle, { color: colors.mutedForeground }]}>Loading pipeline data...</Text>
          </View>
        </View>
        <StatusBar style={isDark ? "light" : "dark"} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* shadcn/ui inspired header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {activeTab === 'map' ? 'Map View' : activeTab === 'repairs' ? `Repair Logs (${repairs.length})` : 'Settings'}
            </Text>
            {cacheStats.hasData && cacheStats.lastUpdated && (
              <Text style={[styles.cacheIndicator, { color: colors.mutedForeground }]}>
                {cacheStats.isValid ? 'Fresh data' : 'Cached data'} • {formatLastUpdate(cacheStats.lastUpdated)}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <NetworkStatus compact={true} />
            <TouchableOpacity 
              style={[styles.button, styles.buttonGhost, { borderColor: colors.border }]} 
              onPress={() => loadData(true)}
              disabled={refreshing}
            >
              <Ionicons 
                name={refreshing ? "refresh" : "refresh-outline"} 
                size={16} 
                color={colors.mutedForeground} 
              />
              <Text style={[styles.buttonText, { color: colors.mutedForeground }]}>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      {activeTab === 'map' ? (
        <View style={styles.mapContainer}>
          <WebView
            style={styles.map}
            source={{ html: generateLeafletHTML() }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            renderLoading={() => (
              <View style={[styles.webViewLoading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.webViewLoadingText, { color: colors.mutedForeground }]}>Loading map...</Text>
              </View>
            )}
          />
        </View>
      ) : activeTab === 'repairs' ? (
        <ScrollView 
          style={[styles.repairsContainer, { backgroundColor: colors.background }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.repairsContent}>
            {/* shadcn/ui inspired stats cards */}
            <View style={styles.statsGrid}>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Overview</Text>
                  <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                    Pipeline infrastructure data
                  </Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                        <Ionicons name="git-network-outline" size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.statNumber, { color: colors.foreground }]}>{pipelines.length}</Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pipelines</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                        <Ionicons name="location-outline" size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.statNumber, { color: colors.foreground }]}>{zones.length}</Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Zones</Text>
                    </View>
                    <View style={styles.statItem}>
                      <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                        <Ionicons name="pin-outline" size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.statNumber, { color: colors.foreground }]}>{markers.length}</Text>
                      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Markers</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Repair Logs */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Repair Logs</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                  {repairs.length} repair{repairs.length !== 1 ? 's' : ''} logged
                </Text>
              </View>
              <View style={styles.cardContent}>
                {repairs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyStateIcon, { backgroundColor: colors.muted }]}>
                      <Ionicons name="construct-outline" size={24} color={colors.mutedForeground} />
                    </View>
                    <Text style={[styles.emptyStateTitle, { color: colors.foreground }]}>No repairs logged yet</Text>
                    <Text style={[styles.emptyStateDescription, { color: colors.mutedForeground }]}>
                      Start logging repairs to track maintenance activities and keep your pipeline infrastructure in optimal condition.
                    </Text>
                    <TouchableOpacity 
                      style={[styles.button, styles.buttonDefault, { backgroundColor: colors.primary }]}
                      onPress={openRepairModal}
                    >
                      <Ionicons name="add" size={16} color={colors.primaryForeground} />
                      <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Log First Repair</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.repairsList}>
                    {repairs.slice(0, 5).map((repair) => (
                      <View key={repair.id} style={[styles.repairItem, { borderBottomColor: colors.border }]}>
                        <View style={styles.repairHeader}>
                          <View style={styles.repairInfo}>
                            <Text style={[styles.repairType, { color: colors.foreground }]}>{repair.repairType}</Text>
                            <Text style={[styles.repairDate, { color: colors.mutedForeground }]}>
                              {repair.timestamp?.toLocaleDateString() || 'Unknown date'}
                            </Text>
                          </View>
                          <View style={[
                            styles.severityBadge, 
                            { 
                              backgroundColor: getSeverityColor(repair.severity, colors),
                            }
                          ]}>
                            <Text style={[styles.severityText, { color: colors.primaryForeground }]}>
                              {repair.severity.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.repairDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
                          {repair.description}
                        </Text>
                        {repair.location && (
                          <Text style={[styles.repairLocation, { color: colors.mutedForeground }]}>
                            📍 {repair.location.latitude.toFixed(4)}, {repair.location.longitude.toFixed(4)}
                          </Text>
                        )}
                      </View>
                    ))}
                    {repairs.length > 5 && (
                      <Text style={[styles.moreRepairs, { color: colors.mutedForeground }]}>
                        +{repairs.length - 5} more repairs
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        // Settings Page
        <ScrollView 
          style={[styles.repairsContainer, { backgroundColor: colors.background }]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.repairsContent}>
            {/* Theme Settings */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Appearance</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                  Customize the app's appearance
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.foreground }]}>Theme</Text>
                    <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                      Choose your preferred theme
                    </Text>
                  </View>
                </View>
                
                <View style={styles.themeOptions}>
                  {(['light', 'dark', 'system'] as const).map((themeOption) => (
                    <TouchableOpacity
                      key={themeOption}
                      style={[
                        styles.button,
                        styles.buttonOutline,
                        { borderColor: colors.border },
                        theme === themeOption && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => setTheme(themeOption)}
                    >
                      <Ionicons 
                        name={
                          themeOption === 'light' ? 'sunny-outline' : 
                          themeOption === 'dark' ? 'moon-outline' : 
                          'phone-portrait-outline'
                        } 
                        size={16} 
                        color={theme === themeOption ? colors.primaryForeground : colors.foreground} 
                      />
                      <Text style={[
                        styles.buttonText,
                        { color: theme === themeOption ? colors.primaryForeground : colors.foreground }
                      ]}>
                        {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* App Settings */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Preferences</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                  Configure app behavior
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.foreground }]}>Notifications</Text>
                    <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                      Receive alerts for system updates
                    </Text>
                  </View>
                  <Switch
                    value={settings.notifications}
                    onValueChange={(value) => updateSettings({ ...settings, notifications: value })}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor={settings.notifications ? colors.primaryForeground : colors.mutedForeground}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: colors.foreground }]}>Auto Refresh</Text>
                    <Text style={[styles.settingDescription, { color: colors.mutedForeground }]}>
                      Automatically refresh data every 5 minutes
                    </Text>
                  </View>
                  <Switch
                    value={settings.autoRefresh}
                    onValueChange={(value) => updateSettings({ ...settings, autoRefresh: value })}
                    trackColor={{ false: colors.muted, true: colors.primary }}
                    thumbColor={settings.autoRefresh ? colors.primaryForeground : colors.mutedForeground}
                  />
                </View>
              </View>
            </View>

            {/* Data Overview */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>Data Overview</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                  Current system statistics
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="git-network-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.statNumber, { color: colors.foreground }]}>{pipelines.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Pipelines</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="location-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.statNumber, { color: colors.foreground }]}>{zones.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Zones</Text>
                  </View>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="pin-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.statNumber, { color: colors.foreground }]}>{markers.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Markers</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* About */}
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.cardForeground }]}>About</Text>
                <Text style={[styles.cardDescription, { color: colors.mutedForeground }]}>
                  App information and version
                </Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.aboutInfo}>
                  <Text style={[styles.aboutTitle, { color: colors.foreground }]}>Pipeline Viewer</Text>
                  <Text style={[styles.aboutVersion, { color: colors.mutedForeground }]}>Version 1.0.0</Text>
                  <Text style={[styles.aboutDescription, { color: colors.mutedForeground }]}>
                    A modern mobile application for viewing and managing pipeline infrastructure data.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      )}

      {/* shadcn/ui inspired bottom navigation */}
      <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'map' && { backgroundColor: colors.accent }]}
          onPress={() => handleTabChange('map')}
        >
          <Ionicons 
            name={activeTab === 'map' ? "map" : "map-outline"}
            size={20} 
            color={activeTab === 'map' ? colors.accentForeground : colors.mutedForeground} 
          />
          <Text style={[
            styles.navText, 
            { color: activeTab === 'map' ? colors.accentForeground : colors.mutedForeground }
          ]}>
            Map
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'repairs' && { backgroundColor: colors.accent }]}
          onPress={() => handleTabChange('repairs')}
        >
          <Ionicons 
            name={activeTab === 'repairs' ? "construct" : "construct-outline"}
            size={20} 
            color={activeTab === 'repairs' ? colors.accentForeground : colors.mutedForeground} 
          />
          <Text style={[
            styles.navText, 
            { color: activeTab === 'repairs' ? colors.accentForeground : colors.mutedForeground }
          ]}>
            Repairs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'settings' && { backgroundColor: colors.accent }]}
          onPress={() => handleTabChange('settings')}
        >
          <Ionicons 
            name={activeTab === 'settings' ? "settings" : "settings-outline"}
            size={20} 
            color={activeTab === 'settings' ? colors.accentForeground : colors.mutedForeground} 
          />
          <Text style={[
            styles.navText, 
            { color: activeTab === 'settings' ? colors.accentForeground : colors.mutedForeground }
          ]}>
            Settings
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          onPress={openRepairModal}
        >
          <Ionicons name="add" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* shadcn/ui inspired modal */}
      <Modal
        visible={showRepairModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              onPress={() => setShowRepairModal(false)}
              style={[styles.button, styles.buttonGhost, { borderColor: colors.border }]}
            >
              <Ionicons name="close" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log Repair</Text>
            <TouchableOpacity 
              onPress={submitRepair}
              style={[styles.button, styles.buttonDefault, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Location Section */}
            <View style={styles.formGroup}>
              <View style={styles.locationHeader}>
                <Text style={[styles.formLabel, { color: colors.foreground }]}>Location</Text>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonOutline, { borderColor: colors.border }]}
                  onPress={fetchCurrentLocation}
                >
                  <Ionicons name="location-outline" size={16} color={colors.foreground} />
                  <Text style={[styles.buttonText, { color: colors.foreground }]}>
                    {repairForm.locationFetched ? 'Refresh GPS' : 'Get GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.coordinateInputs}>
                <View style={styles.coordinateInput}>
                  <Text style={[styles.coordinateLabel, { color: colors.mutedForeground }]}>Latitude</Text>
                  <View style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.inputText, { color: colors.foreground }]}
                      placeholder="6.9271"
                      placeholderTextColor={colors.mutedForeground}
                      value={repairForm.latitude}
                      onChangeText={(text) => setRepairForm({...repairForm, latitude: text})}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View style={styles.coordinateInput}>
                  <Text style={[styles.coordinateLabel, { color: colors.mutedForeground }]}>Longitude</Text>
                  <View style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.inputText, { color: colors.foreground }]}
                      placeholder="79.8612"
                      placeholderTextColor={colors.mutedForeground}
                      value={repairForm.longitude}
                      onChangeText={(text) => setRepairForm({...repairForm, longitude: text})}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
              
              {repairForm.accuracy > 0 && (
                <Text style={[styles.accuracyText, { color: colors.mutedForeground }]}>
                  GPS Accuracy: ±{repairForm.accuracy.toFixed(0)}m
                </Text>
              )}
            </View>

            {/* Repair Type Section */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Repair Type</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Picker
                  selectedValue={repairForm.type}
                  onValueChange={(value) => {
                    const selectedType = repairTypes.find(type => type.name === value);
                    if (selectedType) {
                      setRepairForm({
                        ...repairForm, 
                        type: selectedType.name,
                        description: selectedType.description,
                        severity: selectedType.defaultSeverity
                      });
                    } else {
                      setRepairForm({
                        ...repairForm, 
                        type: value,
                      });
                    }
                  }}
                  style={[styles.picker, { color: colors.foreground }]}
                >
                  <Picker.Item label="Select repair type..." value="" />
                  {repairTypes.map((type) => (
                    <Picker.Item 
                      key={type.id} 
                      label={`${type.name} - ${type.description}`} 
                      value={type.name} 
                    />
                  ))}
                </Picker>
              </View>
            </View>
            
            {/* Custom Description */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Additional Details</Text>
              <View style={[styles.input, styles.textarea, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.inputText, styles.textareaText, { color: colors.foreground }]}
                  placeholder="Add any additional details about the repair..."
                  placeholderTextColor={colors.mutedForeground}
                  value={repairForm.description}
                  onChangeText={(text) => setRepairForm({...repairForm, description: text})}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
            
            {/* Severity Level */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.foreground }]}>Severity Level</Text>
              <View style={styles.severityGrid}>
                {(['low', 'medium', 'high', 'critical'] as const).map((severity) => (
                  <TouchableOpacity
                    key={severity}
                    style={[
                      styles.button,
                      styles.buttonOutline,
                      { borderColor: colors.border },
                      repairForm.severity === severity && { 
                        backgroundColor: getSeverityColor(severity, colors), 
                        borderColor: getSeverityColor(severity, colors) 
                      }
                    ]}
                    onPress={() => setRepairForm({...repairForm, severity})}
                  >
                    <Text style={[
                      styles.buttonText,
                      { color: repairForm.severity === severity ? colors.primaryForeground : colors.foreground }
                    ]}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <StatusBar style={isDark ? "light" : "dark"} />
    </SafeAreaView>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <CustomSplashScreen onAnimationFinish={handleSplashFinish} />;
  }

  return (
    <ThemeProvider>
      <NetworkProvider>
        <SnackbarProvider>
          <NotificationProvider>
            <AppContent />
            <NotificationContainer />
          </NotificationProvider>
        </SnackbarProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

const createStyles = (colors: typeof lightColors) => StyleSheet.create({
  // Base Layout
  container: {
    flex: 1,
  },
  
  // Loading Screen - shadcn/ui inspired
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.025,
    lineHeight: 32,
  },
  loadingSpinner: {
    marginVertical: 24,
  },
  loadingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Header - shadcn/ui inspired
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.025,
  },
  cacheIndicator: {
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Buttons - shadcn/ui system
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 8,
  },
  buttonDefault: {
    // backgroundColor set dynamically
  },
  buttonOutline: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.025,
  },

  // Map Container
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewLoadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },

  // Repairs Container
  repairsContainer: {
    flex: 1,
  },
  repairsContent: {
    padding: 16,
    gap: 16,
  },

  // Cards - shadcn/ui inspired
  card: {
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.025,
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 2,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  // Stats Grid
  statsGrid: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.025,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.025,
  },

  // Empty State - shadcn/ui inspired
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 16,
  },
  emptyStateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.025,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Bottom Navigation - shadcn/ui inspired
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.025,
  },
  fabButton: {
    position: 'absolute',
    right: 16,
    top: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },

  // Modal - shadcn/ui inspired
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.025,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Forms - shadcn/ui inspired
  formGroup: {
    gap: 8,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.025,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  textarea: {
    minHeight: 80,
  },
  textareaText: {
    textAlignVertical: 'top',
  },

  // Severity Grid
  severityGrid: {
    flexDirection: 'row',
    gap: 8,
  },

  // Settings Styles
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.025,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  aboutInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.025,
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  aboutDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Repair List Styles
  repairsList: {
    gap: 12,
  },
  repairItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  repairInfo: {
    flex: 1,
  },
  repairType: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.025,
    marginBottom: 2,
  },
  repairDate: {
    fontSize: 12,
    fontWeight: '400',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  repairDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 4,
  },
  repairLocation: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'monospace',
  },
  moreRepairs: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    paddingVertical: 8,
    fontStyle: 'italic',
  },

  // Enhanced Form Styles
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  coordinateInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  coordinateInput: {
    flex: 1,
  },
  coordinateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
});