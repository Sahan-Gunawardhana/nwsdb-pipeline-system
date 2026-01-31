import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';

interface StatusBannerProps {
  message: string;
  type: 'info' | 'warning' | 'success';
  visible: boolean;
  onDismiss?: () => void;
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  message,
  type,
  visible,
  onDismiss,
  persistent = false,
  action,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide down animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide up animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getBannerColors = () => {
    switch (type) {
      case 'success':
        return {
          background: '#E8F5E8',
          text: '#1B5E20',
          accent: '#4CAF50',
        };
      case 'warning':
        return {
          background: '#FFF3E0',
          text: '#E65100',
          accent: '#FF9800',
        };
      case 'info':
        return {
          background: '#E3F2FD',
          text: '#0D47A1',
          accent: '#2196F3',
        };
      default:
        return {
          background: '#F5F5F5',
          text: '#424242',
          accent: '#9E9E9E',
        };
    }
  };

  const colors = getBannerColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: colors.accent }]} />
      
      <View style={styles.content}>
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
        
        <View style={styles.actions}>
          {action && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.accent }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionText, { color: colors.accent }]}>
                {action.label}
              </Text>
            </TouchableOpacity>
          )}
          
          {onDismiss && !persistent && (
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={[styles.dismissText, { color: colors.text }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9997,
    flexDirection: 'row',
    paddingTop: Platform.OS === 'ios' ? 44 : 24, // Status bar height
    paddingBottom: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  accent: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.25,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dismissButton: {
    padding: 6,
    borderRadius: 6,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '400',
  },
});