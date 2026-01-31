"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, RefreshCw, AlertCircle, Loader2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg"
}

export function LoadingState({ message = "Loading...", size = "md" }: LoadingStateProps) {
  const sizes = {
    sm: { spinner: "h-4 w-4", text: "text-sm" },
    md: { spinner: "h-8 w-8", text: "text-base" },
    lg: { spinner: "h-12 w-12", text: "text-lg" }
  }

  const { spinner, text } = sizes[size]

  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <Loader2 className={`${spinner} animate-spin text-blue-600 mx-auto mb-4`} />
        <p className={`${text} text-gray-600`}>{message}</p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message?: string
  error?: unknown
  onRetry?: () => void
  showDetails?: boolean
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An error occurred while loading the data. Please try again.",
  error,
  onRetry,
  showDetails = false
}: ErrorStateProps) {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-xl font-semibold text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && showDetails && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription className="font-mono text-xs">
              {error instanceof Error ? error.message : String(error)}
            </AlertDescription>
          </Alert>
        )}
        
        {onRetry && (
          <div className="flex justify-center">
            <Button onClick={onRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface EmptyStateProps {
  title: string
  message: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, message, icon, action }: EmptyStateProps) {
  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon && <div className="mb-4 text-gray-400">{icon}</div>}
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-center mb-6">{message}</p>
        {action && action}
      </CardContent>
    </Card>
  )
}

interface SkeletonTableProps {
  rows?: number
  columns?: number
}

export function SkeletonTable({ rows = 5, columns = 6 }: SkeletonTableProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} className="h-4 w-24" />
          ))}
        </div>
      ))}
    </div>
  )
}

interface SkeletonCardProps {
  lines?: number
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}
