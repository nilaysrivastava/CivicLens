import { SafetyRisk } from "../../types/report";

export function calcEvidenceScore(
  confidence: number,
  hasImage: boolean,
  hasLocation: boolean,
  visibleEvidenceCount: number,
  validationCount: number,
  duplicateCount: number,
  hasDescription: boolean = false
): number {
  let score = 0;
  
  score += confidence * 35;
  
  if (hasImage) score += 25;
  
  if (hasLocation) score += 15;
  
  score += Math.min(visibleEvidenceCount * 5, 10);
  
  if (hasDescription) score += 5;
  
  score += Math.min(validationCount * 3, 5);
  
  score += Math.min(duplicateCount * 3, 5);
  
  return Math.min(Math.round(score), 100);
}

export function calcPriorityScore(
  severity: number,
  urgency: number,
  safetyRisk: SafetyRisk,
  validationCount: number,
  duplicateCount: number,
  createdAtDate: Date,
  address: string
): number {
  let score = 0;
  
  score += severity * 10;
  score += urgency * 8;
  
  switch (safetyRisk) {
    case "critical": score += 18; break;
    case "high": score += 12; break;
    case "medium": score += 6; break;
    case "low": score += 0; break;
  }
  
  score += Math.min(validationCount * 3, 12);
  score += Math.min(duplicateCount * 3, 10);
  
  const ageDays = (new Date().getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);
  score += Math.min(ageDays, 5);
  
  const keywords = ["school", "hospital", "bus stop", "market", "college", "main road", "highway", "station"];
  const lowerAddress = address.toLowerCase();
  if (keywords.some(k => lowerAddress.includes(k))) {
    score += 8;
  }
  
  return Math.min(Math.round(score), 100);
}
