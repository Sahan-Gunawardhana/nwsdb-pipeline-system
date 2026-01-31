"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useAuth } from "@/lib/auth-context"
import { AuthForm } from "@/components/auth-form"
import { ErrorBoundary } from "@/components/error-boundary"
import { Toaster } from "@/components/ui/toaster"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { LogOut, Map, Menu, Settings, Route, MapPin, ChevronLeft, Square } from "lucide-react"

// Dynamically import components to avoid SSR issues with Leaflet
const MapWithSidebar = dynamic(() => import("@/components/map-with-sidebar").then(mod => ({ default: mod.MapWithSidebar })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})

const PipelinesTable = dynamic(() => import("@/components/data-tables").then(mod => ({ default: mod.PipelinesTable })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
})

const ZonesTable = dynamic(() => import("@/components/data-tables").then(mod => ({ default: mod.ZonesTable })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
})

const MarkersTable = dynamic(() => import("@/components/data-tables").then(mod => ({ default: mod.MarkersTable })), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
})

export default function Home() {
  const { user, logout, loading } = useAuth()
  const [dataUpdateTrigger, setDataUpdateTrigger] = useState(0)
  const [currentView, setCurrentView] = useState("map")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const handleDataUpdate = () => {
    setDataUpdateTrigger((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Collapsible Professional Sidebar */}
        <div className={`hidden lg:flex lg:flex-col transition-all duration-300 ${sidebarOpen ? 'lg:w-64' : 'lg:w-16'}`}>
        <div className="flex flex-col flex-1 min-h-0 bg-white border-r border-gray-200">
          {/* Header with Toggle */}
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Network Map</h1>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-1 ml-auto"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <ChevronLeft className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`} />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="mt-4 flex-1 px-3 space-y-1">
            <button
              onClick={() => setCurrentView("map")}
              className={`group flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2 text-sm font-medium rounded-md w-full text-left ${
                currentView === "map"
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={!sidebarOpen ? "Network Map" : ""}
            >
              <Map className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''}`} />
              {sidebarOpen && "Network Map"}
            </button>
            
            <button
              onClick={() => setCurrentView("pipelines")}
              className={`group flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2 text-sm font-medium rounded-md w-full text-left ${
                currentView === "pipelines"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={!sidebarOpen ? "Pipelines" : ""}
            >
              <Route className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''}`} />
              {sidebarOpen && "Pipelines"}
            </button>
            
            <button
              onClick={() => setCurrentView("zones")}
              className={`group flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2 text-sm font-medium rounded-md w-full text-left ${
                currentView === "zones"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={!sidebarOpen ? "Zones" : ""}
            >
              <Square className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''}`} />
              {sidebarOpen && "Zones"}
            </button>
            
            <button
              onClick={() => setCurrentView("markers")}
              className={`group flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2 text-sm font-medium rounded-md w-full text-left ${
                currentView === "markers"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={!sidebarOpen ? "Markers" : ""}
            >
              <MapPin className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''}`} />
              {sidebarOpen && "Markers"}
            </button>
            
            <button
              onClick={() => setCurrentView("settings")}
              className={`group flex items-center ${sidebarOpen ? 'px-3' : 'px-2 justify-center'} py-2 text-sm font-medium rounded-md w-full text-left ${
                currentView === "settings"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={!sidebarOpen ? "Settings" : ""}
            >
              <Settings className={`h-4 w-4 ${sidebarOpen ? 'mr-3' : ''}`} />
              {sidebarOpen && "Settings"}
            </button>
          </nav>
          
          {/* User Profile at Bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className={`flex items-center ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.email?.split('@')[0] || 'John Doe'}</p>
                  <p className="text-xs text-gray-500">Engineer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 border-b border-gray-200">
              <div>
                <h1 className="text-lg font-bold text-gray-900">Network Map</h1>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="mt-4 flex-1 px-3 space-y-1">
              <button
                onClick={() => {
                  setCurrentView("map")
                  setMobileSidebarOpen(false)
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  currentView === "map"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Map className="mr-3 h-4 w-4" />
                Network Map
              </button>
              
              <button
                onClick={() => {
                  setCurrentView("pipelines")
                  setMobileSidebarOpen(false)
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  currentView === "pipelines"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Route className="mr-3 h-4 w-4" />
                Pipelines
              </button>
              
              <button
                onClick={() => {
                  setCurrentView("zones")
                  setMobileSidebarOpen(false)
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  currentView === "zones"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Square className="mr-3 h-4 w-4" />
                Zones
              </button>
              
              <button
                onClick={() => {
                  setCurrentView("markers")
                  setMobileSidebarOpen(false)
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  currentView === "markers"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <MapPin className="mr-3 h-4 w-4" />
                Markers
              </button>
              
              <button
                onClick={() => {
                  setCurrentView("settings")
                  setMobileSidebarOpen(false)
                }}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  currentView === "settings"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Settings className="mr-3 h-4 w-4" />
                Settings
              </button>
            </nav>
            
            {/* User Profile */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.email?.split('@')[0] || 'John Doe'}</p>
                  <p className="text-xs text-gray-500">Engineer</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Clean Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentView === "map" && "Network Map"}
                  {currentView === "pipelines" && "Pipelines"}
                  {currentView === "zones" && "Zones"}
                  {currentView === "markers" && "Markers"}
                  {currentView === "settings" && "Settings"}
                </h1>
              </div>
              <Button
                variant="outline"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-hidden bg-gray-50">
          {currentView === "map" && (
            <div className="h-full bg-white">
              <MapWithSidebar onDataUpdate={handleDataUpdate} />
            </div>
          )}
          
          {currentView === "pipelines" && (
            <div className="h-full bg-white p-6">
              <PipelinesTable onDataUpdate={handleDataUpdate} />
            </div>
          )}
          
          {currentView === "zones" && (
            <div className="h-full bg-white p-6">
              <ZonesTable onDataUpdate={handleDataUpdate} />
            </div>
          )}
          
          {currentView === "markers" && (
            <div className="h-full bg-white p-6">
              <MarkersTable onDataUpdate={handleDataUpdate} />
            </div>
          )}
          
          {currentView === "settings" && (
            <div className="h-full bg-white flex items-center justify-center">
              <div className="text-center">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
                <p className="text-gray-600">Application settings and configuration options.</p>
              </div>
            </div>
          )}
        </main>
      </div>
      </div>
      <Toaster />
    </ErrorBoundary>
  )
}
