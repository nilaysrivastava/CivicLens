export type IssueStatus = "reported" | "verified" | "under_review" | "assigned" | "in_progress" | "escalated" | "resolved" | "rejected";

export type IssueType = "pothole" | "garbage" | "streetlight" | "water_leakage" | "drainage" | "traffic" | "other";

export type SafetyRisk = "low" | "medium" | "high" | "critical";

export interface Report {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhotoURL: string;
  clusterId: string | null;
  title: string;
  description: string;
  issueType: IssueType;
  imageUrl: string;
  imageDataUrlPreview?: string;
  storageMode?: string;
  lat?: number;
  lng?: number;
  locationAccuracy?: number;
  locationSource?: 'gps' | 'map_pin' | 'manual';
  address: string;
  severity: number;
  urgency: number;
  confidence: number;
  evidenceScore: number;
  priorityScore: number;
  safetyRisk: SafetyRisk;
  department: string;
  aiSummary: string;
  visibleEvidence: string[];
  recommendedAction: string;
  status: IssueStatus;
  validationCount: number;
  duplicateCount: number;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  
  // Escalation
  escalatedAt?: any;
  escalationId?: string;
  assignedDepartment?: string;
  
  // Resolution
  resolutionNote?: string;
  resolutionImageUrl?: string;
  resolutionImageDataUrlPreview?: string;
  resolvedAt?: any;
  resolvedBy?: string;
  resolutionVerified?: boolean;
  resolutionConfidence?: number;
  publicResolutionSummary?: string;
  remainingConcern?: string;
}
