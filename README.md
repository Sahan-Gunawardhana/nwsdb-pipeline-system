# NWSDB Pipeline Management System

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

![License](https://img.shields.io/github/license/Sahan-Gunawardhana/nwsdb-pipeline-system?style=flat-square)
![GitHub repo size](https://img.shields.io/github/repo-size/Sahan-Gunawardhana/nwsdb-pipeline-system?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/Sahan-Gunawardhana/nwsdb-pipeline-system?style=flat-square)

**Water Infrastructure Management System for Non-Revenue Water Prevention**

*Built for the National Water Supply and Drainage Board (NWSDB)*

</div>

---

## Overview

A comprehensive cross-platform solution designed to reduce water loss in distribution networks through real-time monitoring, field repair tracking, and coordinated operations management.

**Key Capabilities:**
- Interactive pipeline network visualization with risk assessment
- GPS-enabled mobile repair logging for field technicians  
- Real-time data synchronization between web and mobile platforms
- Offline functionality with automatic sync when connectivity returns
- Comprehensive analytics for maintenance optimization

## Architecture

<table>
<tr>
<td width="50%" align="center">

### Web Dashboard
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

**Administrative Interface**

- Interactive pipeline network maps
- Risk-based color coding system
- Real-time repair tracking
- Data management interface
- User authentication & roles
- Responsive web design

</td>
<td width="50%" align="center">

### Mobile Field App
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)

**Field Worker Interface**

- GPS-based repair logging
- Offline functionality
- Repair categorization
- Photo capture capability
- Auto-sync when online
- Cross-platform compatibility

</td>
</tr>
</table>

## Technology Stack

<div align="center">

### Frontend Technologies
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

### Styling & UI
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix%20UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)

### Backend & Database
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Firestore](https://img.shields.io/badge/Firestore-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)

### Development Tools
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

</div>

## Getting Started

### Prerequisites

![Node.js](https://img.shields.io/badge/Node.js-16+-43853D?style=flat&logo=node.js&logoColor=white)
![npm](https://img.shields.io/badge/npm-latest-CB3837?style=flat&logo=npm&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Project-039BE5?style=flat&logo=Firebase&logoColor=white)
![Expo CLI](https://img.shields.io/badge/Expo_CLI-latest-000020?style=flat&logo=expo&logoColor=white)

### Installation

```bash
# Clone the repository
git clone https://github.com/Sahan-Gunawardhana/nwsdb-pipeline-system.git
cd nwsdb-pipeline-system

# Install web app dependencies
cd web-app
npm install

# Install mobile app dependencies
cd ../mobile-app/MobilePipelineViewer
npm install
```

### Firebase Configuration

<details>
<summary><strong>Database Setup Instructions</strong></summary>

1. **Create Firebase Project**
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Firestore Database

2. **Required Collections**
   ```
   pipelines/    # Pipeline infrastructure data
   zones/        # Geographic management areas  
   markers/      # Infrastructure points of interest
   repairs/      # Field repair logs
   ```

3. **Get Configuration Keys**
   - Project Settings → General → Your apps
   - Copy Firebase config object

</details>

### Environment Setup

| Web App | Mobile App |
|---------|------------|
| `cd web-app` | `cd mobile-app/MobilePipelineViewer` |
| `cp .env.example .env` | `cp .env.example .env` |
| Edit `.env` with Firebase config | Edit `.env` with Firebase config |

### Running the Applications

<table>
<tr>
<td width="50%" align="center">

**Web Dashboard**

![Next.js](https://img.shields.io/badge/localhost:3000-000000?style=flat&logo=nextdotjs&logoColor=white)

```bash
cd web-app
npm run dev
```

</td>
<td width="50%" align="center">

**Mobile App**

![Expo](https://img.shields.io/badge/Expo_Go-000020?style=flat&logo=expo&logoColor=white)

```bash
cd mobile-app/MobilePipelineViewer
npx expo start
```

</td>
</tr>
</table>

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