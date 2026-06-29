import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getReportById, updateReport } from "../lib/firebaseReports";
import { addTimelineEvent } from "../lib/firebaseTimeline";
import { Report, IssueStatus } from "../types/report";
import { StatusBadge, IssueTypeBadge, SafetyRiskBadge } from "../components/ui/Badges";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Loader2, Send, FileText, CheckCircle2, ShieldAlert, ImageIcon } from "lucide-react";
import { uploadReportImage } from "../lib/firebaseStorage";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export default function AdminIssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Status Update state
  const [status, setStatus] = useState<IssueStatus>('reported');
  const [department, setDepartment] = useState<string>("Municipal review");
  const [updateText, setUpdateText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Escalation state
  const [escalating, setEscalating] = useState(false);
  const [escalationPacket, setEscalationPacket] = useState<any>(null);
  
  // Resolution state
  const [resolving, setResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [resolutionPreview, setResolutionPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const data = await getReportById(id);
        setReport(data);
        if (data) {
          setStatus(data.status);
          setDepartment(data.department);
          
          if (data.escalationId) {
            const escRef = doc(db, "escalations", data.escalationId);
            const escSnap = await getDoc(escRef);
            if (escSnap.exists()) {
              setEscalationPacket(escSnap.data());
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user || !isAdmin || !report) return;
    
    setSubmitting(true);
    try {
      const updates: Partial<Report> = { status, department };
      await updateReport(id, updates);
      
      if (updateText.trim()) {
        await addTimelineEvent({
          reportId: id,
          type: 'admin_action',
          title: `Official Update - Status: ${status.replace('_', ' ')}`,
          description: updateText.trim(),
        });
      }
      setUpdateText("");
      setReport({ ...report, ...updates });
      alert("Status updated successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to submit update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateEscalation = async () => {
    if (!report || !id || !user) return;
    setEscalating(true);
    try {
      const res = await fetch("/api/generate-escalation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportData: report })
      });
      const data = await res.json();
      
      const escalationsRef = collection(db, "escalations");
      const docRef = await addDoc(escalationsRef, {
        reportId: id,
        generatedBy: user.email,
        generatedAt: serverTimestamp(),
        assignedDepartment: data.assignedDepartment || report.department,
        sla: data.sla,
        priorityLabel: data.priorityLabel,
        evidenceLabel: data.evidenceLabel,
        safetyRisk: data.safetyRisk,
        civicSummary: data.civicSummary,
        escalationReason: data.escalationReason,
        requestedActions: data.requestedActions,
        publicUpdate: data.publicUpdate,
        internalNote: data.internalNote,
        status: "sent"
      });

      await updateReport(id, { 
        status: "escalated", 
        escalatedAt: serverTimestamp(),
        escalationId: docRef.id,
        department: data.assignedDepartment || report.department,
        assignedDepartment: data.assignedDepartment || report.department
      });

      await addTimelineEvent({
        reportId: id,
        type: 'admin_action',
        title: `Escalated to ${data.assignedDepartment || report.department}`,
        description: data.publicUpdate || "Issue has been escalated for priority resolution.",
      });

      setStatus("escalated");
      setDepartment(data.assignedDepartment || report.department);
      setReport({ 
        ...report, 
        status: "escalated", 
        escalatedAt: new Date(), 
        department: data.assignedDepartment || report.department,
        assignedDepartment: data.assignedDepartment || report.department
      });
      
      const newEscalationPacket = {
        ...data,
        reportId: id,
        generatedBy: user.email,
        generatedAt: new Date(),
        status: "sent"
      };
      setEscalationPacket(newEscalationPacket);
    } catch (error) {
      console.error("Escalation failed", error);
      alert("Failed to generate escalation packet");
    } finally {
      setEscalating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResolutionFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setResolutionPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !id || !user || !resolutionNote) return;
    setResolving(true);
    
    try {
      let finalImageUrl = "";
      let finalImageDataUrl = "";
      
      if (resolutionFile) {
        try {
          finalImageUrl = await uploadReportImage(resolutionFile, user.uid);
        } catch (storageErr) {
          console.warn("Storage upload failed, using fallback data URL", storageErr);
          if (resolutionPreview) {
            finalImageDataUrl = resolutionPreview;
          }
        }
      }

      // Verify with Gemini
      const verifyRes = await fetch("/api/verify-resolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beforeImageUrl: report.imageUrl,
          beforeImageData: report.imageDataUrlPreview,
          afterImageUrl: finalImageUrl,
          afterImageData: finalImageDataUrl,
          description: report.description,
          resolutionNote
        })
      });
      const verification = await verifyRes.json();

      const resolutionChecksRef = collection(db, "resolutionChecks");
      await addDoc(resolutionChecksRef, {
        reportId: id,
        verifiedBy: user.email,
        verifiedAt: serverTimestamp(),
        verificationData: verification
      });

      const updates: Partial<Report> = {
        status: "resolved",
        resolutionNote,
        resolvedAt: serverTimestamp(),
        resolvedBy: user.email || "Admin",
        resolutionVerified: verification.resolutionVerified,
        resolutionConfidence: verification.confidence,
        publicResolutionSummary: verification.publicResolutionSummary,
        remainingConcern: verification.remainingConcern
      };
      
      if (finalImageUrl) updates.resolutionImageUrl = finalImageUrl;
      if (finalImageDataUrl) updates.resolutionImageDataUrlPreview = finalImageDataUrl;

      await updateReport(id, updates);

      await addTimelineEvent({
        reportId: id,
        type: 'admin_action',
        title: verification.resolutionVerified ? "Resolution proof verified." : "Resolution proof submitted. Manual verification recommended.",
        description: verification.publicResolutionSummary || "The issue has been marked as resolved.",
      });

      setStatus("resolved");
      setReport({ ...report, ...updates });
      setResolutionNote("");
      setResolutionFile(null);
      setResolutionPreview(null);
      alert("Issue resolved successfully!");
    } catch (error) {
      console.error("Resolution failed", error);
      alert("Failed to mark issue as resolved.");
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!report) return <div className="p-10 text-white">Report not found</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{report.title}</h1>
                  <p className="text-slate-400 text-sm">{report.address}</p>
                </div>
                <StatusBadge status={report.status} />
              </div>

              {/* Before Image */}
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 mb-6 border border-slate-700">
                {(report.imageUrl || report.imageDataUrlPreview) ? (
                  <img src={report.imageUrl || report.imageDataUrlPreview} alt="Before" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">No photo provided</div>
                )}
              </div>

              <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-300 mb-6 border border-slate-700">
                <span className="font-semibold text-slate-100">Reporter Description:</span> {report.description}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Issue Type</div>
                  <IssueTypeBadge type={report.issueType} />
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Safety Risk</div>
                  <SafetyRiskBadge risk={report.safetyRisk} />
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Priority Score</div>
                  <div className="text-xl font-bold text-white">{report.priorityScore}</div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Evidence Score</div>
                  <div className="text-xl font-bold text-blue-400">{report.evidenceScore}%</div>
                </div>
              </div>
            </div>

            {/* Civic Intelligence Panel */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-blue-400" />
                Civic Intelligence & Context
              </h2>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-slate-500 mb-1 font-semibold">Civic Intelligence Summary</div>
                  <p className="text-slate-300">{report.aiSummary}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <div className="text-slate-500 mb-1 font-semibold">Routed Department</div>
                    <p className="text-slate-300">{report.department}</p>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1 font-semibold">Recommended Action</div>
                    <p className="text-slate-300">{report.recommendedAction}</p>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 mb-1 font-semibold">Visible Evidence</div>
                  <ul className="list-disc pl-5 text-slate-300">
                    {report.visibleEvidence?.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Resolution Check Result */}
            {report.status === "resolved" && (
              <div className="bg-green-900/20 rounded-2xl p-6 border border-green-800">
                <h2 className="text-lg font-bold text-green-400 flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolution Verification
                </h2>
                
                {report.resolutionImageUrl || report.resolutionImageDataUrlPreview ? (
                   <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 mb-6 border border-slate-700">
                    <img src={report.resolutionImageUrl || report.resolutionImageDataUrlPreview} alt="After" className="w-full h-full object-cover" />
                  </div>
                ) : null}
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-semibold text-green-300">Verified: </span>
                    <span className="text-white">{report.resolutionVerified ? "Yes" : "Manual Required"}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-green-300">Note: </span>
                    <span className="text-white">{report.resolutionNote}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-green-300">Summary: </span>
                    <span className="text-white">{report.publicResolutionSummary}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Column */}
          <div className="space-y-6">
            
            {/* Status Update Form */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="font-bold text-white mb-4">Update Case Status</h3>
              <form onSubmit={handleUpdateStatus} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IssueStatus)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="reported">Reported</option>
                    <option value="verified">Verified</option>
                    <option value="under_review">Under Review</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="escalated">Escalated</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="Municipal review">Municipal review</option>
                    <option value="Roads / PWD">Roads / PWD</option>
                    <option value="Sanitation">Sanitation</option>
                    <option value="Street Lighting">Street Lighting</option>
                    <option value="Water Department">Water Department</option>
                    <option value="Drainage Department">Drainage Department</option>
                    <option value="Traffic Police">Traffic Police</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Public Log Note</label>
                  <textarea
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="Note for the public timeline..."
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Save Status"}
                </button>
              </form>
            </div>

            {/* Escalation Button */}
            {report.status !== "escalated" && report.status !== "resolved" && (
              <div className="bg-orange-900/20 rounded-2xl p-6 border border-orange-800/50 text-center">
                <ShieldAlert className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-bold text-orange-200 mb-2">Escalate Issue</h3>
                <p className="text-xs text-orange-200/70 mb-4">Prepare a formal escalation brief and alert senior officials.</p>
                <button
                  onClick={handleGenerateEscalation}
                  disabled={escalating}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {escalating ? <Loader2 className="animate-spin h-4 w-4" /> : "Prepare Escalation Brief"}
                </button>
              </div>
            )}
            
            {escalationPacket && (
              <div className="bg-slate-800 rounded-2xl border border-orange-500/50 overflow-hidden shadow-lg shadow-orange-900/20">
                <div className="bg-orange-500/10 px-5 py-4 flex items-center justify-between border-b border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-orange-400" />
                    <h3 className="font-bold text-orange-100">Escalation Brief</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-500/20 text-orange-300 text-[10px] uppercase font-bold rounded-full">
                    {escalationPacket.status === 'sent' ? 'Sent to Department' : 'Prepared'}
                  </span>
                </div>
                
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500 text-xs uppercase mb-1">Target Department</div>
                      <div className="font-medium text-white">{escalationPacket.assignedDepartment}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs uppercase mb-1">Required SLA</div>
                      <div className="font-medium text-orange-400">{escalationPacket.sla}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs uppercase mb-1">Priority Level</div>
                      <div className="font-medium text-red-400">{escalationPacket.priorityLabel}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs uppercase mb-1">Generated At</div>
                      <div className="font-medium text-slate-300">
                         {escalationPacket.generatedAt ? 
                           (escalationPacket.generatedAt.toDate ? 
                             escalationPacket.generatedAt.toDate().toLocaleString() : 
                             new Date(escalationPacket.generatedAt).toLocaleString()) 
                           : 'Unknown'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Civic Summary</div>
                    <p className="text-sm text-slate-200">{escalationPacket.civicSummary}</p>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Reason for Escalation</div>
                    <p className="text-sm text-orange-200/90">{escalationPacket.escalationReason}</p>
                  </div>
                  
                  <div>
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Requested Actions</div>
                    <ul className="list-decimal list-inside text-sm text-slate-300 space-y-1">
                      {(escalationPacket.requestedActions || []).map((action: string, i: number) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-700/50">
                    <div className="text-slate-400 text-xs font-bold uppercase mb-2">Internal Note</div>
                    <p className="text-xs text-slate-400 font-mono bg-slate-900 p-3 rounded-lg border border-slate-800">
                      {escalationPacket.internalNote}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const text = `ESCALATION BRIEF\n\nDepartment: ${escalationPacket.assignedDepartment}\nSLA: ${escalationPacket.sla}\nPriority: ${escalationPacket.priorityLabel}\n\nSummary:\n${escalationPacket.civicSummary}\n\nReason:\n${escalationPacket.escalationReason}\n\nRequested Actions:\n${(escalationPacket.requestedActions || []).map((a: string, i: number) => `${i+1}. ${a}`).join('\n')}`;
                      navigator.clipboard.writeText(text);
                      alert('Brief copied to clipboard');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" /> Copy Brief Text
                  </button>
                </div>
              </div>
            )}

            {/* Resolve Form */}
            {report.status !== "resolved" && (
              <div className="bg-green-900/10 rounded-2xl p-6 border border-green-800/30">
                <h3 className="font-bold text-green-400 mb-4">Mark as Resolved</h3>
                <form onSubmit={handleResolve} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Resolution Note</label>
                    <textarea
                      required
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="What action was taken?"
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-green-500 resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">After Photo (Proof)</label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-700 hover:border-green-500 rounded-lg p-4 text-center cursor-pointer transition-colors"
                    >
                      {resolutionPreview ? (
                        <img src={resolutionPreview} alt="Preview" className="h-20 mx-auto rounded" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon className="h-6 w-6 mb-1" />
                          <span className="text-xs">Click to upload photo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resolving || !resolutionNote}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {resolving ? <Loader2 className="animate-spin h-4 w-4" /> : "Submit Resolution Proof"}
                  </button>
                </form>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}

