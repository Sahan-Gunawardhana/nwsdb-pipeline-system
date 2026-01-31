# NWSDB Pipeline Management System

A water pipeline infrastructure management system built for the National Water Supply and Drainage Board (NWSDB) to help reduce Non-Revenue Water (NRW) losses. This system combines a web-based admin dashboard with a mobile field worker app to track pipeline networks and coordinate repair activities.

## What it does

The system tackles the problem of water loss in distribution networks by providing tools to:

- **Monitor pipeline health** with interactive maps showing risk levels and infrastructure data
- **Track field repairs** in real-time as workers log issues using GPS-enabled mobile devices  
- **Coordinate operations** between office managers and field technicians
- **Analyze data** to identify problem areas and optimize maintenance schedules
- **Reduce water loss** through better visibility and faster response times

Built specifically for water utility operations, it handles the workflow from detecting issues in the field to tracking repairs through completion.

## System Components

### 🖥️ Web Dashboard (`web-app/`)
Administrative interface for managers and office staff built with Next.js:
- Interactive pipeline network visualization using Leaflet maps
- Risk-based color coding (green = good condition, red = needs attention)
- Real-time repair tracking and status updates
- Data management for pipelines, zones, and infrastructure markers
- User authentication and role management
- Responsive design that works on desktop and mobile browsers

### 📱 Mobile Field App (`mobile-app/MobilePipelineViewer/`)
React Native app for field technicians and repair crews:
- GPS-based repair logging with precise location capture
- Offline functionality for areas with poor connectivity
- Predefined repair categories (leak, burst, valve issue, etc.)
- Severity classification (low, medium, high, critical)
- Photo capture and additional notes
- Automatic sync when connection is restored
- Dark/light theme support for outdoor visibility

## Tech Stack

**Web App:**
- Next.js 14 with TypeScript
- Tailwind CSS + shadcn/ui components  
- Leaflet for interactive maps
- Firebase for backend

**Mobile App:**
- React Native with Expo
- TypeScript
- React Native Maps
- Firebase sync
- Offline support with AsyncStorage

## Getting Started

### Prerequisites

You'll need:
- Node.js (version 16 or higher)
- npm or yarn
- A Firebase project
- Expo CLI: `npm install -g @expo/cli`

### 1. Clone and Install

```bash
git clone <this-repo>
cd nwsdb-pipeline-system

# Install web app
cd web-app
npm install

# Install mobile app
cd ../mobile-app/MobilePipelineViewer
npm install
```

### 2. Firebase Setup

Create a Firebase project at https://console.firebase.google.com and:

1. Enable Firestore Database
2. Set up these collections: `pipelines`, `zones`, `markers`, `repairs`
3. Get your config from Project Settings > General > Your apps

### 3. Environment Configuration

**For the web app:**
```bash
cd web-app
cp .env.example .env
# Edit .env with your Firebase config
```

**For the mobile app:**
```bash
cd mobile-app/MobilePipelineViewer
cp .env.example .env  
# Edit .env with your Firebase config
```

### 4. Run the Apps

**Web dashboard:**
```bash
cd web-app
npm run dev
```
Opens at http://localhost:3000

**Mobile app:**
```bash
cd mobile-app/MobilePipelineViewer
npx expo start
```
Scan QR code with Expo Go app or press 'i' for iOS simulator

## How the system works

1. **Field Assessment**: Technicians use the mobile app to log repairs while on-site, capturing GPS coordinates, repair type, and severity level
2. **Real-time Sync**: Data automatically syncs to Firebase when the device has connectivity (works offline and syncs later)
3. **Dashboard Monitoring**: Office staff see all repairs appear on the web dashboard map in real-time
4. **Coordination**: Managers can track repair status, assign resources, and monitor completion
5. **Analytics**: Historical data helps identify recurring problem areas and optimize maintenance schedules

The color-coded pipeline system helps prioritize work:
- 🟢 **Green**: Good condition (risk score 0.0-0.3)
- 🟡 **Yellow**: Monitor closely (risk score 0.3-0.7)  
- 🟠 **Orange**: Schedule maintenance (risk score 0.7-0.9)
- 🔴 **Red**: Immediate attention needed (risk score 0.9-1.0)

## Key Features

### Web Dashboard
- Interactive pipeline map with risk-based colors
- Data tables for pipelines, zones, and repair records
- Real-time updates when field workers log repairs
- Responsive design works on desktop and mobile
- User authentication

### Mobile App  
- GPS-based repair logging
- Offline functionality with auto-sync
- Predefined repair categories and severity levels
- Dark/light theme support
- Network status indicator

## Firebase Database Structure

The system uses Firestore with these main collections:

```
pipelines/          # Pipeline infrastructure records
├── geometry        # GeoJSON line data for map display
├── riskScore      # Calculated risk level (0.0 to 1.0)
├── material       # Pipe material (PVC, steel, cast iron, etc.)
├── diameter       # Pipe diameter in mm
├── installDate    # Installation date
└── lastInspection # Last maintenance date

zones/             # Geographic management areas
├── name           # Zone identifier (e.g., "Zone A", "Colombo North")
├── geometry       # Zone boundary polygons
├── population     # Population served
├── houses         # Number of service connections
└── manager        # Responsible staff member

markers/           # Infrastructure points of interest
├── name           # Marker description
├── type           # Category (valve, pump, meter, etc.)
├── coordinates    # [latitude, longitude]
├── status         # Operational status
└── lastService    # Last service date

repairs/           # Field repair logs
├── location       # GPS coordinates from mobile app
├── type           # Repair category (leak, burst, blockage, etc.)
├── severity       # Impact level (low/medium/high/critical)
├── timestamp      # When repair was logged
├── description    # Technician notes
├── photos         # Image attachments (if any)
├── status         # Workflow status (reported/assigned/in-progress/completed)
├── assignedTo     # Technician assigned
└── completedDate  # Resolution timestamp
```

## Deployment Options

**Web Dashboard:**
- Deploy to Vercel (recommended): `vercel --prod`
- Alternative: Netlify, AWS Amplify, or any Next.js-compatible host
- Environment variables must be configured in the hosting platform

**Mobile App:**
- Development: Use Expo Go for testing
- Production: Build with EAS Build for app store distribution
- Command: `eas build --platform all`

## Development Notes

- **Data Synchronization**: Both apps connect to the same Firebase project, ensuring real-time updates across platforms
- **Offline Support**: Mobile app caches essential data locally and queues repairs for upload when connectivity returns
- **Color Consistency**: Risk-based colors are calculated using the same formula across web and mobile: `rgb(riskScore * 283, 255 - riskScore * 283, 0)`
- **Error Handling**: Web app includes comprehensive error boundaries and user-friendly error messages
- **Performance**: Map rendering is optimized for large datasets with clustering and viewport-based loading

## Common Setup Issues

**Maps not displaying:**
- Verify Firebase configuration is correct
- Check that Firestore security rules allow read access
- Ensure collections exist and have sample data

**Mobile app connection problems:**
- Confirm Expo CLI is updated to latest version
- Check that Firebase project has mobile app registered
- Verify network permissions in app.json

**Data not syncing:**
- Review Firestore security rules
- Check Firebase project quotas and billing
- Verify environment variables match between web and mobile

## License

MIT License

---

This system was developed to address real challenges in water infrastructure management. The goal is to help utility companies reduce water loss and improve service delivery through better coordination between field operations and management.