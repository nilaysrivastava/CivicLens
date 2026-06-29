# CivicLens

<div align="center">

## From local proof to verified civic action.

**CivicLens** is an AI-powered civic issue reporting and operations platform that converts citizen complaints into verified, prioritized, and authority-ready civic cases.

Built for the **Vibe2Ship Hackathon** under the problem statement:

### Community Hero — Hyperlocal Problem Solver

<br />

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth%20%7C%20Storage-orange?logo=firebase)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?logo=google)](https://ai.google.dev/)
[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-4285F4?logo=googlecloud)](https://cloud.google.com/run)

<br />

**Live Demo:**  
https://ais-pre-t7pdrjdzdiu2wvlp3ycdwe-371737902526.asia-southeast1.run.app

**Source Code:**  
`<PASTE_GITHUB_REPOSITORY_LINK_HERE>`

**Project Description Doc:**  
`<PASTE_GOOGLE_DOC_LINK_HERE>`

</div>

---

## Preview

> Add screenshots before final submission if available.

| Landing Page              | Citizen Report Flow      |
| ------------------------- | ------------------------ |
| `screenshots/landing.png` | `screenshots/report.png` |

| Civic Map             | Admin Command Center    |
| --------------------- | ----------------------- |
| `screenshots/map.png` | `screenshots/admin.png` |

---

## Overview

CivicLens is a full-stack civic-tech platform that helps citizens report local issues such as potholes, garbage accumulation, broken streetlights, water leakage, drainage overflow, and traffic hazards.

Instead of leaving reports as scattered complaints, CivicLens turns them into structured civic cases with proof, location context, AI-assisted analysis, public visibility, admin triage, escalation briefs, and resolution tracking.

The goal is simple:

> Turn local proof into verified civic action.

---

## Problem Statement

### Community Hero — Hyperlocal Problem Solver

Local civic issues are often reported through fragmented channels such as phone calls, social media posts, WhatsApp groups, or manual complaints. These reports are difficult to verify, prioritize, assign, and track.

Citizens need transparency. Civic teams need structured, evidence-backed, and department-ready cases.

CivicLens solves this by creating an end-to-end civic action workflow from report submission to resolution verification.

---

## Features

### Citizen Workspace

- Submit civic issues with title, description, type, address, and photo proof.
- Capture location through GPS, manual address, or map-pin fallback.
- Track personal reports through a private citizen dashboard.
- Browse the public issue board.
- Explore reported cases on the civic map.

### Public Issue Board

- View reported civic cases.
- Check status, issue type, location, department, and priority.
- Open detailed public case files.
- Track report progress transparently.

### Civic Map

- Interactive location-based civic case map.
- Marker popups with issue previews.
- Responsive mobile, tablet, and desktop layout.
- Fallback location list for reports without exact coordinates.

### Admin Operations Command Center

- View civic case statistics.
- Review all submitted reports.
- Filter and prioritize the case queue.
- Open detailed admin case files.
- Update case status and operational notes.

### Escalation Brief Generator

- Generate authority-ready escalation briefs.
- Include SLA, department, issue summary, requested actions, evidence, and public update.
- Render clean structured briefs instead of raw AI markdown.

### Resolution Workflow

- Submit resolution proof.
- Add public resolution notes.
- Track before/after case progress.
- Improve transparency and accountability.

---

## AI-Powered Civic Intelligence

CivicLens uses Gemini-powered workflows to convert raw citizen reports into actionable civic intelligence.

AI-assisted outputs include:

- Issue summarization
- Issue classification
- Evidence reasoning
- Civic priority scoring
- Safety risk estimation
- Department routing
- Recommended action generation
- Escalation brief generation
- Resolution verification support

If Gemini is unavailable or degraded, the app uses deterministic fallback logic so the core civic reporting workflow remains stable.

---

## Google Technologies Used

| Google Technology    | Usage                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| **Google AI Studio** | Full-stack app building, iteration, and deployment                       |
| **Gemini API**       | Civic analysis, summaries, escalation briefs, and resolution reasoning   |
| **Firebase Auth**    | Authentication and role-aware access support                             |
| **Cloud Firestore**  | Reports, users, timelines, escalations, validations, and resolution data |
| **Firebase Storage** | Photo proof storage support                                              |
| **Google Cloud Run** | Full-stack production deployment through AI Studio                       |

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React
- Recharts
- Leaflet / React-Leaflet

### Backend

- Node.js
- Express
- Server-side API routes
- Gemini API integration
- Cloud Run production server

### Data and Infrastructure

- Firebase
- Cloud Firestore
- Firebase Storage
- Google Cloud Run
- Google AI Studio

---

## Architecture

```text
Citizen / Judge / Admin
        |
        v
React + Vite Frontend
        |
        |-- Landing Page
        |-- Citizen Dashboard
        |-- Public Issue Board
        |-- Civic Map
        |-- Admin Command Center
        |
        v
Express Backend on Cloud Run
        |
        |-- /api/analyze-issue
        |-- /api/escalation
        |-- /api/resolution-check
        |-- /api/reports
        |
        v
Google / Firebase Services
        |
        |-- Gemini API
        |-- Firestore
        |-- Firebase Auth
        |-- Firebase Storage
```

---

## User Roles

### Citizen

Citizens can:

- Report civic issues
- Add photo proof
- Add location details
- Track their own submitted reports
- View public cases
- Explore the civic map

### Admin / Civic Operations

Admins can:

- View all reports
- Access the operations dashboard
- Review the case queue
- Open case details
- Generate escalation briefs
- Submit resolution proof
- Manage case lifecycle

---

## Main Routes

| Route               | Description               |
| ------------------- | ------------------------- |
| `/`                 | Landing page              |
| `/login`            | Login and judge access    |
| `/report`           | Citizen report submission |
| `/dashboard`        | Citizen dashboard         |
| `/issues`           | Public issue board        |
| `/issues/:id`       | Public case file          |
| `/map`              | Civic map                 |
| `/admin`            | Admin command center      |
| `/admin/issues`     | Admin case queue          |
| `/admin/issues/:id` | Admin case detail         |

---

## Firestore Collections

```text
users
reports
timeline
validations
clusters
escalations
resolutionChecks
```

---

## Data Model Snapshot

```ts
type Report = {
  id: string;
  title: string;
  description: string;
  issueType: string;
  address: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
  imageDataUrlPreview?: string;
  status: "reported" | "verified" | "in_progress" | "resolved";
  priorityScore: number;
  evidenceScore: number;
  safetyRisk: "low" | "medium" | "high" | "critical";
  assignedDepartment: string;
  userId: string;
  reporterName: string;
  reporterEmail?: string;
  createdAt: string;
};
```

---

## Judge Access

The deployed app includes judge-ready access from the login page.

### Citizen Workspace

Use this to test:

- Report submission
- Photo proof
- Location flow
- Citizen dashboard
- Public case file

### Operations Workspace

Use this to test:

- Admin dashboard
- Case queue
- Case detail
- Escalation brief
- Resolution proof workflow

---

## Local Development

### 1. Clone the repository

```bash
git clone <PASTE_GITHUB_REPOSITORY_LINK_HERE>
cd civiclens
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file if required:

```env
GEMINI_API_KEY=your_gemini_api_key
ADMIN_EMAILS=nilay2103@gmail.com,nilayaws21@gmail.com
```

Important:

- `GEMINI_API_KEY` must remain server-side only.
- Do not expose Gemini secrets through `VITE_` variables.
- Firebase client config may be loaded from the AI Studio generated Firebase config.

### 4. Run locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

### 6. Start production server

```bash
npm start
```

---

## Deployment

CivicLens is deployed using **Google AI Studio Build Mode** to **Google Cloud Run**.

The production server handles:

- React/Vite static asset serving
- Express API routes
- Gemini server-side calls
- React Router SPA fallback
- Nested route refresh support

### Live URL

```text
https://ais-pre-t7pdrjdzdiu2wvlp3ycdwe-371737902526.asia-southeast1.run.app
```

---

## Deployment Notes

Google AI Studio Starter Tier manages parts of the Firebase and Cloud Run deployment environment. Because some Firebase console-level settings may not be directly editable in Starter Tier, CivicLens includes deployment-safe judge access so evaluators can test both citizen and operations workflows from the published Cloud Run URL.

The app still uses the real deployed frontend, backend APIs, Firestore data layer, Gemini-powered routes, and civic operations workflows.

---

## Project Structure

```text
.
├── src
│   ├── components
│   ├── context
│   ├── lib
│   ├── pages
│   ├── types
│   └── App.tsx
│
├── server.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── firebase-applet-config.json
└── README.md
```

---

## Demo Flow

A suggested 2-minute judging flow:

1. Open the deployed CivicLens URL.
2. Show the landing page and explain the problem.
3. Enter the Citizen Workspace.
4. Submit a civic report with issue type, location, description, and image proof.
5. Open the submitted case file.
6. Visit the public issue board and civic map.
7. Switch to the Operations Workspace.
8. Open the Admin Command Center.
9. Review the case queue.
10. Open the submitted case.
11. Generate an escalation brief.
12. Submit or explain resolution proof.
13. Close with the impact: CivicLens turns local proof into verified civic action.

---

## Known Limitations

- Google AI Studio Starter Tier may restrict direct Firebase project-owner settings.
- Firebase Storage may fall back to secure preview image handling in restricted environments.
- AI outputs use deterministic fallback logic when Gemini is temporarily unavailable.
- Official municipal department integrations are simulated for hackathon evaluation.

---

## Future Scope

- Ward-level civic dashboards
- SLA breach alerts
- SMS/email citizen notifications
- Multilingual issue reporting
- Duplicate issue clustering
- Municipal ticketing system integration
- Citizen validation reputation score
- Real-time civic heatmaps
- Department-wise performance analytics
- Mobile field-worker application

---

## Hackathon Submission

| Item                    | Link                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| Live Demo               | https://ais-pre-t7pdrjdzdiu2wvlp3ycdwe-371737902526.asia-southeast1.run.app                      |
| Project Description Doc | https://docs.google.com/document/d/1thGpZsMJCLwKVrlFZOl9W8GVkMr9QdoiO4S63KGUUvw/edit?usp=sharing |

---

## License

This project was built as a hackathon prototype for evaluation purposes.

---

<div align="center">

### CivicLens

**From local proof to verified civic action.**

</div>
