# Pipeline Management System

A water pipeline monitoring and repair tracking system I built to help manage infrastructure and reduce water loss. The project has two parts - a web dashboard for managers and a mobile app for field workers.

## What does it do?

This system helps water companies track their pipeline networks and manage repairs more effectively. Field workers can log repairs using the mobile app, and office staff can see everything on a web dashboard with maps and data tables.

The main goal is to reduce "non-revenue water" - basically water that gets lost due to leaks, bursts, or other infrastructure problems.

## Project Structure

```
├── web-app/                    # Web dashboard (Next.js)
├── mobile-app/                 # Mobile field app (React Native/Expo)
└── README.md
```

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

## How it works

1. **Field workers** use the mobile app to log repairs with GPS coordinates
2. **Data syncs** to Firebase in real-time (works offline too)
3. **Web dashboard** shows all repairs on an interactive map
4. **Managers** can track repair status and coordinate teams
5. **Pipeline risk levels** are color-coded from green (good) to red (critical)

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

## Firebase Collections

Your Firestore should have:

```
pipelines/     # Pipeline data with geometry and risk scores
zones/         # Geographic management areas  
markers/       # Points of interest
repairs/       # Repair logs from mobile app
```

## Deployment

**Web app:** Deploy to Vercel, Netlify, or any Next.js host
**Mobile app:** Use `eas build` for app store deployment

## Development Notes

- Both apps share the same Firebase project for data sync
- Colors are consistent across platforms using risk-based calculations
- Mobile app caches data locally for offline use
- Web app has comprehensive error handling and loading states

## Issues?

Common problems:
- **Maps not loading:** Check your Firebase config
- **Mobile app crashes:** Make sure Expo CLI is updated
- **Data not syncing:** Verify Firestore security rules

## License

MIT License - feel free to use this for your own projects.

---

Built this to solve real water infrastructure challenges. Hope it helps other utilities manage their networks better!