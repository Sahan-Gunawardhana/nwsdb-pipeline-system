import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNotification } from '../contexts/NotificationContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { Toast } from './Toast';
import { StatusBanner } from './StatusBanner';
import { SnackbarContainer } from './Snackbar';

export const NotificationContainer: React.FC = () => {
  const { toastState, hideToast, bannerState, hideBanner } = useNotification();

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Status Banner - Top priority, appears at top */}
      <StatusBanner
        message={bannerState.message}
        type={bannerState.type}
        visible={bannerState.visible}
        onDismiss={bannerState.persistent ? undefined : hideBanner}
        persistent={bannerState.persistent}
        action={bannerState.action}
      />
      
      {/* Toast - Medium priority, appears below status bar */}
      <Toast
        message={toastState.message}
        type={toastState.type}
        visible={toastState.visible}
        onHide={hideToast}
        duration={toastState.duration}
      />
      
      {/* Snackbar - Low priority, appears at bottom */}
      <SnackbarContainer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});