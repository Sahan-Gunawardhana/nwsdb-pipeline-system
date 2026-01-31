"use client"

import { useErrorToast } from "@/components/error-toast"

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public isUserError: boolean = false
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function createErrorHandler(options: ErrorHandlerOptions = {}) {
  const { showToast = true, logError = true, fallbackMessage = "An unexpected error occurred" } = options

  return {
    handleError: (error: unknown, context?: string) => {
      const errorMessage = getErrorMessage(error)
      const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage

      if (logError) {
        console.error(fullMessage, error)
      }

      if (showToast) {
        // This will be handled by the component using the hook
        return fullMessage
      }

      return errorMessage
    },

    createUserError: (message: string, code?: string) => {
      return new AppError(message, code, undefined, true)
    },

    createSystemError: (message: string, code?: string, statusCode?: number) => {
      return new AppError(message, code, statusCode, false)
    }
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === "string") {
    return error
  }
  
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  
  return "An unexpected error occurred"
}

export function isUserError(error: unknown): boolean {
  return error instanceof AppError && error.isUserError
}

export function isSystemError(error: unknown): boolean {
  return error instanceof AppError && !error.isUserError
}

// Hook for components to handle errors with toast notifications
export function useAppErrorHandler() {
  const { showError, showWarning, showInfo } = useErrorToast()
  
  const handleError = (error: unknown, context?: string) => {
    const errorMessage = getErrorMessage(error)
    const fullMessage = context ? `${context}: ${errorMessage}` : errorMessage
    
    if (isUserError(error)) {
      showWarning("Action Required", errorMessage)
    } else {
      showError("Error", fullMessage)
    }
    
    return errorMessage
  }

  const handleAsync = async <T>(
    operation: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T | undefined> => {
    try {
      return await operation()
    } catch (error) {
      handleError(error, context)
      return fallback
    }
  }

  return {
    handleError,
    handleAsync,
    createUserError: (message: string, code?: string) => 
      new AppError(message, code, undefined, true),
    createSystemError: (message: string, code?: string, statusCode?: number) => 
      new AppError(message, code, statusCode, false)
  }
}

// Common error patterns
export const CommonErrors = {
  NETWORK_ERROR: "Network connection failed. Please check your internet connection.",
  PERMISSION_DENIED: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Server error occurred. Please try again later.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  AUTH_ERROR: "Authentication failed. Please sign in again.",
  QUOTA_EXCEEDED: "Service quota exceeded. Please try again later.",
  MAINTENANCE: "Service is under maintenance. Please try again later."
} as const

// Error codes mapping
export const ErrorCodes = {
  PERMISSION_DENIED: "permission-denied",
  NOT_FOUND: "not-found",
  UNAVAILABLE: "unavailable",
  RESOURCE_EXHAUSTED: "resource-exhausted",
  INVALID_ARGUMENT: "invalid-argument",
  ALREADY_EXISTS: "already-exists",
  FAILED_PRECONDITION: "failed-precondition",
  ABORTED: "aborted",
  OUT_OF_RANGE: "out-of-range",
  UNIMPLEMENTED: "unimplemented",
  INTERNAL: "internal",
  DATA_LOSS: "data-loss"
} as const
