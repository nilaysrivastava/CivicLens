import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getReportById } from "../lib/firebaseReports";
import { getTimelineForReport, TimelineEvent } from "../lib/firebaseTimeline";
import { createValidation, hasUserValidatedReport } from "../lib/firebaseValidations";
import { Report } from "../types/report";
import { StatusBadge, IssueTypeBadge, SafetyRiskBadge } from "../components/ui/Badges";
import { MapPin, Calendar, CheckCircle2, AlertTriangle, Building2, User, Loader2, ArrowLeft } from "lucide-react";

export default function IssueDetail() {
  const { id } = useParams();
  const { user, isCitizen, isAdmin, isSignedIn } = useAuth();
  
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);
  const [hasValidated, setHasValidated] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const [reportData, timelineData] = await Promise.all([
          getReportById(id),
          getTimelineForReport(id)
        ]);
        
        if (reportData) {
          setReport(reportData);
          if (user) {
            const validated = await hasUserValidatedReport(id, user.uid);
            setHasValidated(validated);
          }
        } else {
          setError("Issue not found.");
        }
        setTimeline(timelineData);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load issue details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, user]);

  const handleValidate = async () => {
    if (!id || !user || !isCitizen) return;
    setValidating(true);
    try {
      await createValidation(id, user.uid);
      setHasValidated(true);
      // Optimistic update
      setReport(prev => prev ? { ...prev, validationCount: prev.validationCount + 1 } : prev);
      const updatedTimeline = await getTimelineForReport(id);
      setTimeline(updatedTimeline);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to validate issue.");
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-sm max-w-md w-full">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{error || "Issue not found"}</h3>
          <Link to="/issues" className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/issues" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Issues
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image & Basic Info */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
              <div className="h-72 sm:h-96 w-full bg-slate-200 relative">
                <img src={report.imageUrl || report.imageDataUrlPreview} alt={report.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <StatusBadge status={report.status} />
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  <IssueTypeBadge type={report.issueType} />
                  <SafetyRiskBadge risk={report.safetyRisk} />
                  {(report.imageUrl || report.imageDataUrlPreview) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Photo Proof Submitted
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
                  {report.title || "Civic Issue Report"}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-slate-600 mb-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {report.address}
                  </div>
                  <div className="hidden sm:block text-slate-300">•</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : "Recently"}
                  </div>
                </div>

                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed">
                    {report.description || "No additional description provided."}
                  </p>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                    {report.userPhotoURL ? (
                      <img src={report.userPhotoURL} alt={report.userName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      report.userName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Reported by {report.userName}</p>
                    <p className="text-xs text-slate-500">Citizen</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Before/After Section */}
            {report.status === "resolved" && (
              <div className="bg-green-50/50 rounded-3xl p-6 sm:p-8 border border-green-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <CheckCircle2 className="h-24 w-24 text-green-600" />
                </div>
                <div className="flex items-center gap-3 mb-6 relative z-10">
                  <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Resolved</span>
                  <h2 className="text-lg font-bold text-slate-900">Resolution Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 relative z-10">
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 mb-2">Before</h3>
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                      <img src={report.imageUrl || report.imageDataUrlPreview} alt="Before" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  {(report.resolutionImageUrl || report.resolutionImageDataUrlPreview) && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 mb-2">After</h3>
                      <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-300">
                        <img src={report.resolutionImageUrl || report.resolutionImageDataUrlPreview} alt="After" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 relative z-10">
                  {report.resolutionNote && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Official Resolution Note</h4>
                      <p className="text-sm text-slate-700 bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
                        {report.resolutionNote}
                      </p>
                    </div>
                  )}
                  {report.publicResolutionSummary && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Civic Verification Summary</h4>
                      <div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
                        <CheckCircle2 className={`h-5 w-5 ${report.resolutionVerified ? 'text-green-600' : 'text-yellow-600'} shrink-0`} />
                        <p className="text-sm text-slate-700">
                          {report.publicResolutionSummary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Civic Intelligence Panel */}
            <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm relative overflow-hidden ${report.confidence < 0.5 ? 'bg-yellow-50/50 border-yellow-100' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className={`h-24 w-24 ${report.confidence < 0.5 ? 'text-yellow-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex items-center gap-3 mb-4 relative z-10">
                {report.confidence < 0.5 ? (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">Manual Review Recommended</span>
                ) : (
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-mono uppercase tracking-wider font-bold">AI Verified</span>
                )}
                <h2 className="text-lg font-bold text-slate-900">Civic Intelligence Summary</h2>
              </div>
              
              {report.confidence < 0.5 && (
                <div className="mb-4 text-sm font-medium text-yellow-800 bg-yellow-100/50 p-3 rounded-xl border border-yellow-200 relative z-10">
                  Manual review is recommended for this report.
                </div>
              )}

              <div className="space-y-5 relative z-10">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {report.aiSummary}
                </p>
                
                {report.confidence >= 0.5 && report.visibleEvidence && report.visibleEvidence.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visible Evidence Identified</h4>
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {report.visibleEvidence.map((evidence, i) => (
                        <li key={i}>{evidence}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {report.duplicateCount > 0 && (
                  <div className="bg-white/60 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Duplicate Clustered</h4>
                      <p className="text-xs text-slate-600">This issue has been clustered with {report.duplicateCount} similar nearby report(s).</p>
                    </div>
                  </div>
                )}

                {report.confidence >= 0.5 && (
                  <>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 pt-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Routed to: <span className="text-blue-700">{report.department}</span>
                    </div>
                    
                    <div className="bg-white/60 rounded-xl p-4 border border-blue-100 mt-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Recommended Action</p>
                      <p className="text-sm text-slate-800 font-medium">{report.recommendedAction}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Timeline */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Issue Timeline</h2>
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10">
                      {event.type === 'citizen_action' ? <User size={16} /> : <CheckCircle2 size={16} />}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-slate-900 text-sm">{event.title}</div>
                        <time className="font-mono text-xs text-slate-400">
                          {event.createdAt?.toDate ? event.createdAt.toDate().toLocaleDateString() : 'Just now'}
                        </time>
                      </div>
                      <div className="text-slate-600 text-sm leading-relaxed">{event.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Panel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-blue-50 text-blue-600 rounded-full p-4">
                  <CheckCircle2 size={32} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {report.validationCount} <span className="text-slate-500 font-medium text-base">Validations</span>
              </h3>
              <p className="text-sm text-slate-500 mb-6 px-4">
                Community verifications help prioritize this issue for city officials.
              </p>
              
              {!isSignedIn ? (
                <Link to="/login" className="block w-full rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                  Log in to verify
                </Link>
              ) : isAdmin ? (
                <Link to={`/admin/issues/${report.id}`} className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition-colors">
                  Manage in Admin
                </Link>
              ) : report.userId === user?.uid ? (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 border border-slate-100">
                  You reported this issue
                </div>
              ) : hasValidated ? (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700 border border-green-100 flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} />
                  You verified this
                </div>
              ) : (
                <button
                  onClick={handleValidate}
                  disabled={validating}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 size={18} />}
                  Confirm this issue
                </button>
              )}
            </div>

            {/* Metric Scores Panel */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6">Civic Priority Scores</h3>
              
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-slate-100">Evidence Quality</span>
                    <span className="text-blue-400">{report.evidenceScore}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${report.evidenceScore}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-slate-100">Urgency</span>
                    <span className="text-orange-400">{report.urgency}/5</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(report.urgency / 5) * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-slate-100">Priority Score</span>
                    <span className="text-green-400">{report.priorityScore}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${report.priorityScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
