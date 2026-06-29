import { cn } from "@/lib/utils";
import { IssueStatus, IssueType, SafetyRisk } from "../../types/report";

export function StatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  const styles: Record<IssueStatus, string> = {
    reported: "bg-yellow-100 text-yellow-800 border-yellow-200",
    under_review: "bg-orange-100 text-orange-800 border-orange-200",
    verified: "bg-blue-100 text-blue-800 border-blue-200",
    assigned: "bg-indigo-100 text-indigo-800 border-indigo-200",
    in_progress: "bg-purple-100 text-purple-800 border-purple-200",
    escalated: "bg-red-100 text-red-800 border-red-200",
    resolved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const labels: Record<IssueStatus, string> = {
    reported: "Reported",
    under_review: "Under Review",
    verified: "Verified",
    assigned: "Assigned",
    in_progress: "In Progress",
    escalated: "Escalated",
    resolved: "Resolved",
    rejected: "Rejected",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[status], className)}>
      {labels[status]}
    </span>
  );
}

export function IssueTypeBadge({ type, className }: { type: IssueType; className?: string }) {
  const styles: Record<IssueType, string> = {
    pothole: "bg-slate-100 text-slate-700 border-slate-200",
    garbage: "bg-orange-100 text-orange-800 border-orange-200",
    streetlight: "bg-yellow-100 text-yellow-800 border-yellow-200",
    water_leakage: "bg-cyan-100 text-cyan-800 border-cyan-200",
    drainage: "bg-blue-100 text-blue-800 border-blue-200",
    traffic: "bg-red-100 text-red-800 border-red-200",
    other: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const labels: Record<IssueType, string> = {
    pothole: "Pothole",
    garbage: "Garbage",
    streetlight: "Streetlight",
    water_leakage: "Water Leakage",
    drainage: "Drainage",
    traffic: "Traffic",
    other: "Other",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[type], className)}>
      {labels[type]}
    </span>
  );
}

export function SafetyRiskBadge({ risk, className }: { risk: SafetyRisk; className?: string }) {
  const styles: Record<SafetyRisk, string> = {
    low: "bg-slate-100 text-slate-700 border-slate-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    critical: "bg-red-100 text-red-800 border-red-200",
  };

  const labels: Record<SafetyRisk, string> = {
    low: "Low Risk",
    medium: "Medium Risk",
    high: "High Risk",
    critical: "Critical Risk",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[risk], className)}>
      {labels[risk]}
    </span>
  );
}
