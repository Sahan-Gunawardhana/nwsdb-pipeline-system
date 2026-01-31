"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  AuthError,
  AuthErrorCodes
} from "firebase/auth"
import { auth } from "./firebase"
import { useErrorToast } from "@/components/error-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showError, showSuccess } = useErrorToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      setError(null)
    }, (error) => {
      console.error("Auth state change error:", error)
      setError(getAuthErrorMessage(error))
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const getAuthErrorMessage = (error: AuthError): string => {
    switch (error.code) {
      case AuthErrorCodes.USER_DELETED:
        return "User account not found. Please check your credentials."
      case AuthErrorCodes.INVALID_PASSWORD:
        return "Invalid password. Please try again."
      case AuthErrorCodes.INVALID_EMAIL:
        return "Invalid email address. Please check your email format."
      case AuthErrorCodes.USER_DISABLED:
        return "This account has been disabled. Please contact support."
      case AuthErrorCodes.TOO_MANY_ATTEMPTS_TRY_LATER:
        return "Too many failed attempts. Please try again later."
      case AuthErrorCodes.OPERATION_NOT_ALLOWED:
        return "This operation is not allowed. Please contact support."
      case AuthErrorCodes.EMAIL_EXISTS:
        return "An account with this email already exists."
      case AuthErrorCodes.WEAK_PASSWORD:
        return "Password is too weak. Please choose a stronger password."
      default:
        return error.message || "An authentication error occurred."
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      showSuccess("Successfully signed in", "Welcome back!")
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError)
      setError(errorMessage)
      showError("Sign in failed", errorMessage)
      throw error
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      setError(null)
      await createUserWithEmailAndPassword(auth, email, password)
      showSuccess("Account created successfully", "Welcome to NWSDB!")
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError)
      setError(errorMessage)
      showError("Sign up failed", errorMessage)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      showSuccess("Successfully signed out", "Come back soon!")
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error as AuthError)
      setError(errorMessage)
      showError("Sign out failed", errorMessage)
      throw error
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signIn, 
      signUp, 
      logout, 
      clearError 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
