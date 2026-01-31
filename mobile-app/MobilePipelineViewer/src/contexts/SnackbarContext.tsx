import React, { createContext, useContext, useState, useCallback } from 'react';
import { SnackbarMessage, SnackbarContextType, SnackbarOptions } from '../types/enhancements';

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export const SnackbarProvider: React.FC<SnackbarProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<SnackbarMessage[]>([]);

  const generateId = useCallback(() => {
    return `snackbar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showSnackbar = useCallback((
    message: string, 
    type: SnackbarMessage['type'], 
    options: SnackbarOptions = {}
  ) => {
    const {
      duration = type === 'error' ? 6000 : 4000,
      persistent = false,
      action,
    } = options;

    const newMessage: SnackbarMessage = {
      id: generateId(),
      message,
      type,
      duration,
      persistent,
      action,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);

    // Auto-dismiss if not persistent
    if (!persistent) {
      setTimeout(() => {
        hideSnackbar(newMessage.id);
      }, duration);
    }
  }, [generateId]);

  const hideSnackbar = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setMessages([]);
  }, []);

  const contextValue: SnackbarContextType = {
    messages,
    showSnackbar,
    hideSnackbar,
    clearAll,
  };

  return (
    <SnackbarContext.Provider value={contextValue}>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};