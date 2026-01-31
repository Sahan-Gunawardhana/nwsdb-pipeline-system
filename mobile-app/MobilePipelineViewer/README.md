# 📱 Pipeline Viewer Mobile App

A modern React Native mobile application for viewing and managing pipeline infrastructure data with real-time repair logging capabilities.

## ✨ Features

### 🗺️ Interactive Map
- **Unified color scheme** synchronized with web application
- **Risk-based pipeline coloring** (green to red gradient based on risk score)
- **Dynamic zone coloring** based on pipeline risk within zones
- **Real-time pipeline visualization** with detailed popups
- **Tap-to-report** repair functionality anywhere on map
- **Repair marker display** with severity-based colors

### 🔧 Advanced Repair Management
- **Universal repair categories** with comprehensive type selection
- **GPS-based repair logging** with automatic location detection
- **Additional information field** for tools needed, affected areas, etc.
- **Severity classification** (low, medium, high, critical)
- **Manual coordinate editing** for precise location entry
- **Real-time sync** with web application
- **Detailed repair tracking** with status management

### 🎨 Modern UI/UX
- **shadcn/ui inspired design** with clean, professional interface
- **Dark/Light theme support** with system preference detection
- **Material Design elements** throughout the app
- **Intuitive navigation** with bottom tab bar and floating action button

### ⚙️ Advanced Features
- **Offline storage** with AsyncStorage
- **Auto-refresh** functionality (configurable)
- **Settings management** with persistent preferences
- **Real-time data synchronization** with Firebase

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app on your mobile device

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start the development server:**
```bash
npx expo start
```

3. **Run on device:**
   - Scan the QR code with Expo Go app (Android)
   - Scan with Camera app (iOS) and open with Expo Go

## 🔧 Configuration

### Environment Variables
The app uses its own `.env` file with Firebase configuration:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Configuration
EXPO_PUBLIC_APP_NAME=Pipeline Viewer
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 📱 App Structure

```
src/
├── components/          # Reusable UI components
│   ├── RepairForm.tsx   # Universal repair reporting form
│   ├── RepairList.tsx   # Repair records management
│   ├── RepairDetail.tsx # Detailed repair view
│   └── ...             # Other UI components
├── screens/            # Screen components
├── services/           # Firebase and API services
│   ├── firebase.ts     # Firebase configuration
│   ├── firebaseService.ts  # Data fetching services
│   ├── locationService.ts  # GPS location services
│   └── storageService.ts   # Local storage utilities
├── types/              # TypeScript type definitions
│   └── index.ts        # Includes universal repair categories
├── utils/              # Utility functions
│   ├── colors.ts       # Color synchronization utilities
│   └── coordinates.ts  # Coordinate conversion utilities
└── data/               # Mock data and constants
    └── mockData.ts     # Includes color functions
```

## 🛠️ Development

### Tech Stack
- **React Native** with Expo SDK 53
- **TypeScript** for type safety
- **Firebase** for backend services
- **AsyncStorage** for local data persistence
- **Expo Location** for GPS functionality
- **React Native WebView** for Leaflet map rendering

### Development Commands
```bash
# Start development server
npx expo start

# Start with specific platform
npx expo start --ios
npx expo start --android

# Clear cache
npx expo start --clear
```

## 🎨 Color Synchronization

The mobile app now uses the exact same color scheme as the web application:

### Pipeline Colors
- **Risk-based gradient**: Green (0.0) to Red (0.9)
- **Formula**: `rgb(riskScore * 283, 255 - riskScore * 283, 0)`
- **Consistent visual representation** across platforms

### Zone Colors
- **Dynamic coloring** based on pipeline risk within zone boundaries
- **Gray**: No pipelines in zone
- **Risk gradient**: Calculated from high-risk pipeline ratio

### Repair Markers
- **Red**: Critical severity repairs
- **Orange**: High severity repairs
- **Yellow**: Medium/Low severity repairs

## 🔧 Universal Repair Categories

The app includes comprehensive repair categories for better organization:

- **Pipeline Issues**: Leaks, bursts, blockages, corrosion, joint failures
- **Valve Problems**: Leaks, seized valves, replacements, missing handles
- **Infrastructure**: Meter issues, manhole problems, access points
- **Water Quality**: Pressure issues, supply problems, contamination
- **Emergency**: Major water loss, service interruptions, safety hazards
- **Maintenance**: Inspections, preventive maintenance, upgrades

Each category includes specific repair types and supports additional information fields for tools needed, affected areas, and special considerations.

## 🔄 Data Synchronization

The app maintains real-time synchronization with the web application through Firebase:

- **Repairs** are stored in both `repairs` and `markers` collections
- **Pipeline data** is fetched from shared collections
- **User-scoped data** ensures proper data isolation
- **Automatic refresh** keeps data current
- **Color consistency** maintained across all platforms

## 🎨 Theming

The app supports dynamic theming with three modes:
- **Light Mode** - Clean, bright interface
- **Dark Mode** - Easy on the eyes for low-light use
- **System Mode** - Automatically follows device preference

## 📍 Location Services

### GPS Features
- **Automatic location detection** when logging repairs
- **Manual coordinate editing** for precise positioning
- **Location accuracy display** for confidence indication
- **Permission handling** with user-friendly prompts

## 🚀 Deployment

### Development (Expo Go)
- Use Expo Go app for development and testing
- Supports hot reloading and debugging

### Production Build
```bash
# Build for app stores using EAS
npx eas build --platform all
```

---

**Built with ❤️ using React Native and Expo**