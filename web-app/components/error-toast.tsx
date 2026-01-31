"use client"

import { useToast } from "@/hooks/use-toast"
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react"

export interface ToastMessage {
  type: "success" | "error" | "warning" | "info"
  title: string
  description?: string
  duration?: number
}

export function useErrorToast() {
  const { toast } = useToast()

  const showToast = (message: ToastMessage) => {
    const icons = {
      success: <CheckCircle className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />,
      warning: <AlertCircle className="h-4 w-4" />,
      info: <Info className="h-4 w-4" />
    }

    const variants = {
      success: "default",
      error: "destructive",
      warning: "default",
      info: "default"
    } as const

    toast({
      title: message.title,
      description: message.description,
      duration: message.duration || 5000,
      variant: variants[message.type],
      action: icons[message.type]
    })
  }

  const showSuccess = (title: string, description?: string) => {
    showToast({ type: "success", title, description })
  }

  const showError = (title: string, description?: string) => {
    showToast({ type: "error", title, description })
  }

  const showWarning = (title: string, description?: string) => {
    showToast({ type: "warning", title, description })
  }

  const showInfo = (title: string, description?: string) => {
    showToast({ type: "info", title, description })
  }

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }
}

// Helper function to get user-friendly error messages
export function getErrorMessage(error: unknown): string {
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

// Helper function to get error details for debugging
export function getErrorDetails(error: unknown): { message: string; code?: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack
    }
  }
  
  if (error && typeof error === "object") {
    return {
      message: getErrorMessage(error),
      code: "code" in error ? String(error.code) : undefined,
      stack: "stack" in error ? String(error.stack) : undefined
    }
  }
  
  return {
    message: getErrorMessage(error)
  }
}
