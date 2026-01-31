import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SnackbarMessage } from '../types/enhancements';
import { useSnackbar } from '../contexts/SnackbarContext';

const { width: screenWidth } = Dimensions.get('window');

interface SnackbarProps {
  message: SnackbarMessage;
}

const SnackbarItem: React.FC<SnackbarProps> = ({ message }) => {
  const { hideSnackbar } = useSnackbar();
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Material Design 3 entrance animation - slide up with scale and fade
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, scaleAnim, opacityAnim]);

  const handleDismiss = () => {
    // Material Design 3 exit animation - slide out with scale and fade
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hideSnackbar(message.id);
    });
  };

  const getMaterialColors = () => {
    switch (message.type) {
      case 'success': 
        return {
          background: '#1B5E20', // Material Green 900
          surface: '#2E7D32',     // Material Green 800
          onSurface: '#E8F5E8',   // Light green text
          icon: '✓'
        };
      case 'error': 
        return {
          background: '#B71C1C', // Material Red 900
          surface: '#C62828',     // Material Red 800
          onSurface: '#FFEBEE',   // Light red text
          icon: '✕'
        };
      case 'warning': 
        return {
          background: '#E65100', // Material Orange 900
          surface: '#EF6C00',     // Material Orange 800
          onSurface: '#FFF3E0',   // Light orange text
          icon: '⚠'
        };
      case 'info': 
        return {
          background: '#0D47A1', // Material Blue 900
          surface: '#1565C0',     // Material Blue 800
          onSurface: '#E3F2FD',   // Light blue text
          icon: 'ℹ'
        };
      default: 
        return {
          background: '#212121', // Material Grey 900
          surface: '#424242',     // Material Grey 800
          onSurface: '#F5F5F5',   // Light grey text
          icon: ''
        };
    }
  };

  const colors = getMaterialColors();

  return (
    <Animated.View
      style={[
        styles.snackbar,
        {
          backgroundColor: colors.background,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim }
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      {/* Material Design 3 Surface Layer */}
      <View style={[styles.surface, { backgroundColor: colors.surface }]}>
        <View style={styles.content}>
          <View style={styles.messageContainer}>
            {colors.icon && (
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, { color: colors.onSurface }]}>
                  {colors.icon}
                </Text>
              </View>
            )}
            <Text style={[styles.message, { color: colors.onSurface }]} numberOfLines={2}>
              {message.message}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {message.action && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${colors.onSurface}20` }]}
                onPress={() => {
                  message.action?.onPress();
                  if (!message.persistent) {
                    handleDismiss();
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={message.action.label}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionText, { color: colors.onSurface }]}>
                  {message.action.label}
                </Text>
              </TouchableOpacity>
            )}
            
            {!message.persistent && (
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={handleDismiss}
                accessibilityRole="button"
                accessibilityLabel="Dismiss notification"
                activeOpacity={0.7}
              >
                <Text style={[styles.dismissText, { color: colors.onSurface }]}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export const SnackbarContainer: React.FC = () => {
  const { messages } = useSnackbar();

  if (messages.length === 0) {
    return null;
  }

  // Calculate safe area for proper positioning
  const statusBarHeight = Platform.OS === 'ios' ? (StatusBar.currentHeight || 44) : (StatusBar.currentHeight || 24);
  const bottomSafeArea = Platform.OS === 'ios' ? 34 : 16; // Account for home indicator on iOS

  return (
    <View style={styles.container} pointerEvents="box-none">
      {messages.map((message, index) => (
        <View
          key={message.id}
          style={[
            styles.snackbarWrapper,
            { 
              bottom: bottomSafeArea + 16 + (index * 72), // Material spacing with safe area
            },
          ]}
        >
          <SnackbarItem message={message} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  snackbarWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    pointerEvents: 'box-none',
  },
  snackbar: {
    // Material Design 3 Container
    borderRadius: 12, // Material Design 3 uses 12dp radius
    minHeight: 48,
    maxWidth: screenWidth - 32,
    // Material Design 3 Elevation Level 3
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  surface: {
    // Material Design 3 Surface Layer
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 20,
  },
  messageContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    // Material Design 3 Typography - Body Medium
    letterSpacing: 0.25,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 8,
  },
  actionButton: {
    // Material Design 3 Button - Text Button
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    // Material Design 3 Typography - Label Large
  },
  dismissButton: {
    padding: 8,
    borderRadius: 8,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default SnackbarContainer;