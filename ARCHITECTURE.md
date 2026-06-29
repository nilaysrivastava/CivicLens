# CivicLens Architecture

## Overview
CivicLens is a React-based Single Page Application (SPA) designed to run in modern browsers. It leverages Firebase for secure, scalable backend services and integrates Google's Gemini API for advanced civic intelligence (image analysis, categorization, risk assessment).

## Frontend Architecture
- **Framework:** React 18+ with Vite.
- **Routing:** React Router DOM (Client-side routing).
- **Styling:** Tailwind CSS (Utility-first, responsive design).
- **Maps:** React-Leaflet with OpenStreetMap tiles (does not require an API key, robust fallback design).
- **Icons:** Lucide React.
- **Charts:** Recharts.

## Backend Services (Firebase)
- **Authentication:** Firebase Auth handles secure user sign-in and session management.
- **Database:** Cloud Firestore (NoSQL document database) stores all structured app data.
- **Storage:** Firebase Storage is used for high-resolution photo proof uploads.

### Fallback Mechanisms
- **Storage Fallback:** If Firebase Storage uploads are blocked (e.g., by restrictive preview environments or network rules), CivicLens automatically falls back to storing compressed Base64 Data URLs directly in Firestore.
- **Intelligence Fallback:** If the Gemini API is unreachable, the system gracefully degrades, marking the report for "Manual Review" and applying baseline heuristics, ensuring the citizen's report is never lost.

## Data Model (Firestore)

### `users`
Profiles for citizens and admins.
- `uid`, `email`, `role` ("citizen" or "admin"), `createdAt`.

### `reports`
The core civic case files.
- `title`, `description`, `issueType`, `address`, `lat`, `lng`
- `imageUrl`, `imageDataUrlPreview` (fallback)
- `status` (reported, verified, in_progress, resolved, etc.)
- `priorityScore`, `safetyRisk`, `department`
- `aiSummary`, `evidenceScore`, `visibleEvidence`

### `timeline`
Chronological logs for each case.
- `reportId`, `title`, `description`, `type`, `createdAt`

### `validations`
Community upvotes/validations for issues.
- `reportId`, `userId`, `createdAt`

### `clusters`
Groupings of duplicate or nearby issues.
- `issueType`, `title`, `lat`, `lng`, `priorityScore`, `activeReportIds`, `resolvedReportIds`

### `escalations`
Formal briefs generated for high-priority cases.
- `reportId`, `packetText`, `recommendedSla`, `generatedAt`

### `resolutionChecks`
Before-and-after verification data.
- `reportId`, `beforeImageUrl`, `afterImageUrl`, `resolutionNote`, `verified`

## Workflows

### Citizen Workflow
1. Auth -> Login/Signup.
2. Home -> View Dashboard / Public Issues / Map.
3. Report -> Upload Photo -> Enter Details -> Submit.
4. System -> Compress Image -> Upload -> Run AI Analysis -> Create Case File.

### Admin Workflow
1. Auth (Role-based access control checks `roles.ts` and Firestore).
2. Operations Command Center -> View Case Queue.
3. Case Detail -> Review Civic Intelligence -> Update Status / Route to Department.
4. Action -> Prepare Escalation Brief (AI generation) OR Submit Resolution Proof (Photo upload).
