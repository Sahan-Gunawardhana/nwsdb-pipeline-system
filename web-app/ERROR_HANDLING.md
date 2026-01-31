# Error Handling System Documentation

This document describes the comprehensive error handling system implemented throughout the NWSDB NRW Prevention application using shadcn components.

## Overview

The application implements a multi-layered error handling approach that provides:
- User-friendly error messages
- Consistent error UI components
- Toast notifications for feedback
- Error boundaries for crash prevention
- Comprehensive logging and debugging

## Components

### 1. Error Boundary (`components/error-boundary.tsx`)

A React error boundary component that catches JavaScript errors anywhere in the component tree and displays a fallback UI.

**Features:**
- Catches runtime errors gracefully
- Provides retry functionality
- Shows user-friendly error messages
- Includes navigation options

**Usage:**
```tsx
import { ErrorBoundary } from "@/components/error-boundary"

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 2. Error Toast System (`components/error-toast.tsx`)

A toast notification system for displaying errors, warnings, and success messages.

**Features:**
- Multiple message types (error, warning, success, info)
- Consistent styling using shadcn components
- Configurable duration and appearance
- Icon integration

**Usage:**
```tsx
import { useErrorToast } from "@/components/error-toast"

const { showError, showSuccess, showWarning, showInfo } = useErrorToast()

showError("Operation Failed", "Please try again")
showSuccess("Success", "Operation completed successfully")
```

### 3. Loading and Error States (`components/loading-error-states.tsx`)

Reusable components for consistent loading, error, and empty states.

**Components:**
- `LoadingState`: Shows loading spinners with messages
- `ErrorState`: Displays errors with retry options
- `EmptyState`: Shows empty data states
- `SkeletonTable` & `SkeletonCard`: Loading placeholders

**Usage:**
```tsx
import { LoadingState, ErrorState, EmptyState } from "@/components/loading-error-states"

if (loading) return <LoadingState message="Loading data..." />
if (error) return <ErrorState message={error} onRetry={retry} />
if (isEmpty) return <EmptyState title="No data" message="No items found" />
```

### 4. Error Handler Utility (`lib/error-handler.ts`)

A utility library for consistent error handling patterns.

**Features:**
- Custom `AppError` class with user/system error distinction
- Common error patterns and codes
- Async operation error handling
- Toast integration

**Usage:**
```tsx
import { useAppErrorHandler } from "@/lib/error-handler"

const { handleError, handleAsync } = useAppErrorHandler()

// Handle errors
handleError(error, "Data loading")

// Handle async operations
const result = await handleAsync(
  () => fetchData(),
  "Data fetching",
  fallbackValue
)
```

## Implementation Details

### Authentication Error Handling

The auth context (`lib/auth-context.tsx`) includes comprehensive error handling for:
- Sign in/up failures
- Authentication state changes
- Permission errors
- Network issues

**Error Types:**
- Invalid credentials
- Account disabled
- Too many attempts
- Weak passwords
- Email already exists

### Data Operations Error Handling

All Firestore operations include error handling for:
- Permission denied
- Resource not found
- Service unavailable
- Quota exceeded
- Validation errors

**Functions Covered:**
- `savePipeline`, `getPipelines`, `updatePipeline`, `deletePipeline`
- `saveZone`, `getZones`, `updateZone`, `deleteZone`
- `saveMarker`, `getMarkers`, `updateMarker`, `deleteMarker`

### UI Component Error Handling

All major components include:
- Loading states during data fetching
- Error states with retry options
- Empty states for no data
- Toast notifications for user feedback

**Components Updated:**
- `PipelinesTable`
- `ZonesTable`
- `MarkersTable`
- `MapWithSidebar`
- `AuthForm`

## Error Message Guidelines

### User-Friendly Messages
- Clear and actionable
- Avoid technical jargon
- Provide next steps when possible
- Use consistent language

### Error Categories
1. **User Errors**: Input validation, permissions, etc.
2. **System Errors**: Network issues, server errors, etc.
3. **Authentication Errors**: Login failures, session issues

### Message Examples
- ✅ "Please check your email and password and try again"
- ✅ "You don't have permission to delete this item"
- ✅ "Service is temporarily unavailable. Please try again later"
- ❌ "Error 500: Internal server error"
- ❌ "Failed to execute query"

## Best Practices

### 1. Always Wrap Async Operations
```tsx
try {
  const result = await asyncOperation()
  // Handle success
} catch (error) {
  handleError(error, "Operation context")
}
```

### 2. Use Appropriate Error States
```tsx
if (loading) return <LoadingState />
if (error) return <ErrorState message={error} onRetry={retry} />
if (isEmpty) return <EmptyState title="No data" />
```

### 3. Provide Retry Mechanisms
```tsx
<ErrorState 
  message={error} 
  onRetry={() => loadData()} 
  showDetails={false}
/>
```

### 4. Use Toast Notifications Sparingly
- Success messages for completed actions
- Error messages for failed operations
- Warning messages for user attention required
- Info messages for general information

### 5. Log Errors for Debugging
```tsx
console.error("Error context:", error)
// Always log errors for debugging
```

## Testing Error Handling

### 1. Network Errors
- Disconnect internet during operations
- Test with slow connections
- Verify timeout handling

### 2. Authentication Errors
- Test with invalid credentials
- Test expired sessions
- Test permission restrictions

### 3. Data Validation Errors
- Test with invalid input data
- Test required field validation
- Test data format validation

### 4. Component Error Boundaries
- Test with intentionally broken components
- Verify fallback UI displays correctly
- Test retry functionality

## Future Enhancements

### 1. Error Analytics
- Track error frequency and types
- Monitor user experience impact
- Identify common failure points

### 2. Retry Strategies
- Exponential backoff for network errors
- Smart retry for transient failures
- User-configurable retry limits

### 3. Offline Support
- Cache data for offline access
- Queue operations for later execution
- Sync when connection restored

### 4. Error Reporting
- User error reporting system
- Automatic error submission
- Error context collection

## Conclusion

This error handling system provides a robust foundation for user experience and application stability. It ensures that users are always informed about what's happening and have clear paths to resolve issues. The system is designed to be maintainable, consistent, and user-friendly while providing developers with comprehensive error information for debugging and improvement.
