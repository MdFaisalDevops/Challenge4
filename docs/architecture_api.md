# Monorepo Architecture and API Documentation

This document describes the folder layout, component architecture, database models, and API endpoints of the CrowdMind AI platform.

---

## 📂 Folder Structure Layout

The project is organized as an NPM Workspaces monorepo:

```
├── apps/
│   ├── server/                   # Express backend (TypeScript)
│   │   ├── src/
│   │   │   ├── config/           # Firebase admin & Gemini clients
│   │   │   ├── middleware/       # Auth guards, security, caching, audits
│   │   │   ├── routes/           # Users, incidents, volunteers, AI routes
│   │   │   ├── utils/            # Winston logger, prompt templates, errors
│   │   │   └── index.ts          # Express entrypoint
│   │   └── package.json
│   └── web/                      # Next.js frontend (Tailwind & TS)
│       ├── src/
│       │   ├── app/              # Next.js App Router (dashboard pages)
│       │   ├── components/       # AuthGuard, StadiumMap, subviews
│       │   ├── context/          # AuthState & Accessibility controllers
│       │   └── lib/              # Firebase client settings
│       └── package.json
├── packages/
│   └── shared/                   # Shared TypeScript models and interfaces
└── package.json                  # Monorepo root workspaces manager
```

---

## 🏗️ System Architecture Component Diagram

```
[ Next.js Frontend App ] <--- HTTP REST API ---> [ Express Backend Service ]
          |                                                 |
          v                                                 v
  [ Firebase Auth SDK ]                           [ Gemini Decision Engine ]
          |                                                 |
          +-----------------> [ Firestore ] <---------------+
```

---

## 🗄️ Database Schemas & Collections

Firestore collections follow strict TypeScript schemas exported from the `@crowdmind/shared` package:

### 1. `Users`
- **Path:** `/users/{uid}`
- **Fields:**
  - `id`: string
  - `email`: string
  - `name`: string
  - `role`: `'OpsDirector' | 'SecurityLead' | 'FieldAgent' | 'Guest'`
  - `createdAt`: ISO Timestamp string

### 2. `CrowdData`
- **Path:** `/crowdData/{reportId}`
- **Fields:**
  - `id`: string
  - `nodeId`: string
  - `peopleCount`: number
  - `crowdDensityStatus`: `'low' | 'normal' | 'congested' | 'critical'`
  - `reporterComment`: string (optional)
  - `reportedBy`: string
  - `reportedAt`: ISO Timestamp string

### 3. `Incidents`
- **Path:** `/incidents/{incidentId}`
- **Fields:**
  - `id`: string
  - `type`: `'medical' | 'fire' | 'congestion' | 'structural' | 'security' | 'other'`
  - `severity`: `'low' | 'medium' | 'high' | 'critical'`
  - `status`: `'reported' | 'assigned' | 'resolved'`
  - `location`: `{ sector: string, level: string, description: string }`
  - `reportedBy`: string
  - `reportedAt`: ISO Timestamp string
  - `description`: string

### 4. `Recommendations`
- **Path:** `/recommendations/{recId}`
- **Fields:**
  - `id`: string
  - `title`: string
  - `description`: string
  - `confidenceScore`: number (0.0 to 1.0)
  - `riskScore`: number (0.0 to 1.0)
  - `reasoning`: string
  - `expectedImpact`: string
  - `priority`: `'low' | 'medium' | 'high' | 'critical'`
  - `status`: `'pending' | 'applied' | 'ignored'`
  - `createdAt`: ISO Timestamp string

### 5. `Volunteers`
- **Path:** `/volunteers/{volId}`
- **Fields:**
  - `id`: string
  - `name`: string
  - `status`: `'available' | 'busy' | 'offline'`
  - `skills`: string[]
  - `currentTaskId`: string (optional)
  - `assignedSector`: string

---

## 🌐 Express API Routes

The backend exposes REST APIs documentable under **Swagger UI** on `/api-docs`:

### Authentication & Users
- `POST /api/v1/auth/register`: Create user auth profile.
- `GET /api/v1/users`: Retrieve system operators roster (paginated).
- `GET /api/v1/users/:uid`: Retrieve single user file.

### Operational Metrics
- `POST /api/v1/crowd-reports`: Create crowd density telemetry report.
- `GET /api/v1/crowd-reports`: Query density telemetry records.
- `POST /api/v1/incidents`: Report safety hazard or incident.
- `GET /api/v1/incidents`: Query safety records list.

### AI Decision Engine
- `POST /api/v1/decision-engine/analyze`: Drive Gemini AI decision-making loop. Parses physical stadium metrics and issues structured alerts and recommendations.
