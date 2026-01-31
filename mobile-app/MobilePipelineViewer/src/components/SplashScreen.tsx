import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onAnimationFinish: () => void;
  minDisplayTime?: number;
}

export const CustomSplashScreen: React.FC<CustomSplashScreenProps> = ({
  onAnimationFinish,
  minDisplayTime = 2000,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Keep the native splash screen visible while we prepare the custom one
    SplashScreen.preventAutoHideAsync();

    const startTime = Date.now();

    // Start animations
    const animations = Animated.parallel([
      // Fade in the entire screen
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Scale up the logo
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Rotate the logo slightly
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]);

    // Loading indicator animation (continuous)
    const loadingAnimation = Animated.loop(
      Animated.timing(loadingAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    animations.start();
    loadingAnimation.start();

    // Ensure minimum display time
    const timer = setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsedTime);

      setTimeout(() => {
        // Fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          SplashScreen.hideAsync();
          onAnimationFinish();
        });
      }, remainingTime);
    }, 100);

    return () => {
      clearTimeout(timer);
      loadingAnimation.stop();
    };
  }, [fadeAnim, scaleAnim, logoRotateAnim, loadingAnim, onAnimationFinish, minDisplayTime]);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadingRotate = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background Gradient Effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { scale: scaleAnim },
                { rotate: logoRotate },
              ],
            },
          ]}
        >
          {/* Pipeline Icon */}
          <View style={styles.pipelineIcon}>
            <View style={styles.pipe} />
            <View style={[styles.pipe, styles.pipeVertical]} />
            <View style={styles.junction} />
          </View>
        </Animated.View>

        {/* App Name */}
        <Animated.View style={[styles.titleContainer, { opacity: fadeAnim }]}>
          <Text style={styles.appName}>Pipeline Viewer</Text>
          <Text style={styles.tagline}>Infrastructure Management</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              transform: [{ rotate: loadingRotate }],
            },
          ]}
        >
          <View style={styles.loadingRing} />
        </Animated.View>

        {/* Loading Text */}
        <Text style={styles.loadingText}>Loading...</Text>
      </View>

      {/* Version Info */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    // Add gradient effect with multiple views if needed
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
  },
  pipelineIcon: {
    width: 80,
    height: 80,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipe: {
    position: 'absolute',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  pipeVertical: {
    width: 8,
    height: 60,
    transform: [{ rotate: '90deg' }],
  },
  junction: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    position: 'absolute',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        fontFamily: 'System',
      },
      android: {
        fontFamily: 'Roboto',
      },
    }),
  },
  tagline: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontWeight: '300',
  },
  loadingContainer: {
    marginBottom: 20,
  },
  loadingRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: '#007AFF',
    borderRightColor: '#007AFF',
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: '#666',
  },
});

export default CustomSplashScreen;