import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'info' | 'warning';
  visible: boolean;
  duration?: number;
}

interface BannerState {
  message: string;
  type: 'info' | 'warning' | 'success';
  visible: boolean;
  persistent?: boolean;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface NotificationContextType {
  // Toast methods
  showToast: (message: string, type: 'success' | 'info' | 'warning', duration?: number) => void;
  hideToast: () => void;
  toastState: ToastState;
  
  // Banner methods
  showBanner: (message: string, type: 'info' | 'warning' | 'success', options?: {
    persistent?: boolean;
    action?: { label: string; onPress: () => void };
  }) => void;
  hideBanner: () => void;
  bannerState: BannerState;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [toastState, setToastState] = useState<ToastState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const [bannerState, setBannerState] = useState<BannerState>({
    message: '',
    type: 'info',
    visible: false,
  });

  const showToast = useCallback((
    message: string, 
    type: 'success' | 'info' | 'warning', 
    duration = 2000
  ) => {
    setToastState({
      message,
      type,
      visible: true,
      duration,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  const showBanner = useCallback((
    message: string, 
    type: 'info' | 'warning' | 'success',
    options: {
      persistent?: boolean;
      action?: { label: string; onPress: () => void };
    } = {}
  ) => {
    setBannerState({
      message,
      type,
      visible: true,
      persistent: options.persistent,
      action: options.action,
    });
  }, []);

  const hideBanner = useCallback(() => {
    setBannerState(prev => ({ ...prev, visible: false }));
  }, []);

  const contextValue: NotificationContextType = {
    showToast,
    hideToast,
    toastState,
    showBanner,
    hideBanner,
    bannerState,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};