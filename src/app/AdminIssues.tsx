import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAllReportsForAdmin, updateReport } from "../lib/firebaseReports";
import { addTimelineEvent } from "../lib/firebaseTimeline";
import { Report, IssueStatus } from "../types/report";
import { StatusBadge, IssueTypeBadge } from "../components/ui/Badges";
import { CheckCircle2, ArrowRight, User, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminIssues() {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // New filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority");

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await listAllReportsForAdmin();
        setReports(data);
      } catch (err: any) {
        console.error(err);
        setError("Case queue could not be loaded. Please check admin access permissions.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, newStatus: IssueStatus) => {
    if (!isAdmin || !user) return;
    setUpdatingId(reportId);
    try {
      await updateReport(reportId, { status: newStatus });
      await addTimelineEvent({
        reportId,
        type: 'admin_action',
        title: `Status updated to ${newStatus.replace('_', ' ')}`,
        description: `An official has reviewed and updated the status of this issue.`,
      });
      
      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status: newStatus } : r
      ));
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  let filteredReports = reports.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterType !== "all" && r.issueType !== filterType) return false;
    if (filterDept !== "all" && r.department !== filterDept) return false;
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const titleMatches = r.title ? r.title.toLowerCase().includes(search) : false;
      const addressMatches = r.address ? r.address.toLowerCase().includes(search) : false;
      if (!titleMatches && !addressMatches) return false;
    }
    return true;
  });
  
  if (reports.length > 0 && filteredReports.length === 0 && filterStatus === "all" && filterType === "all" && filterDept === "all" && !searchQuery) {
    console.warn("Filter logic returned zero despite loaded reports.");
    filteredReports = [...reports];
  }

  filteredReports.sort((a, b) => {
    if (sortBy === "priority") return (b.priorityScore || 0) - (a.priorityScore || 0);
    if (sortBy === "newest") {
      const aTime = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
      const bTime = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
      return bTime - aTime;
    }
    if (sortBy === "evidence") return (b.evidenceScore || 0) - (a.evidenceScore || 0);
    if (sortBy === "validations") return (b.validationCount || 0) - (a.validationCount || 0);
    return 0;
  });

  // Temporary development-only logs
  if (process.env.NODE_ENV === "development") {
    console.log("Admin Queue Debug:");
    console.log("- total reports count:", reports.length);
    console.log("- filtered reports count:", filteredReports.length);
    console.log("- selected status filter:", filterStatus);
    console.log("- selected type filter:", filterType);
    console.log("- selected department filter:", filterDept);
    console.log("- selected sort option:", sortBy);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-white">
              Case Queue
            </h1>
            <p className="mt-2 text-slate-400">
              Review, triage, assign, and escalate civic reports.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 w-full min-w-0">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Total Cases</div>
              <div className="text-2xl font-bold text-white">{reports.length}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 w-full min-w-0">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Reported</div>
              <div className="text-2xl font-bold text-blue-400">{reports.filter(r => r.status === 'reported').length}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 w-full min-w-0">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">In Progress</div>
              <div className="text-2xl font-bold text-yellow-400">{reports.filter(r => r.status === 'in_progress').length}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 w-full min-w-0">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Escalated</div>
              <div className="text-2xl font-bold text-red-400">{reports.filter(r => r.status === 'escalated').length}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 w-full min-w-0">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Resolved</div>
              <div className="text-2xl font-bold text-green-400">{reports.filter(r => r.status === 'resolved').length}</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 w-full min-w-0">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">High Priority</div>
              <div className="text-2xl font-bold text-red-500">{reports.filter(r => r.priorityScore >= 80).length}</div>
            </div>
          </div>
        )}

        <div className="bg-slate-800 rounded-2xl p-4 mb-8 border border-slate-700 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search title or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 w-full min-w-0 sm:col-span-2 lg:col-span-1"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 w-full min-w-0"
          >
            <option value="all">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="verified">Verified</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 w-full min-w-0"
          >
            <option value="all">All Issue Types</option>
            <option value="pothole">Pothole</option>
            <option value="garbage">Garbage</option>
            <option value="streetlight">Streetlight</option>
            <option value="water_leakage">Water Leakage</option>
            <option value="drainage">Drainage</option>
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 w-full min-w-0"
          >
            <option value="all">All Departments</option>
            <option value="Transportation">Transportation</option>
            <option value="Sanitation">Sanitation</option>
            <option value="Water">Water</option>
            <option value="Public Safety">Public Safety</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-sm rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 w-full min-w-0"
          >
            <option value="priority">Sort by Priority</option>
            <option value="newest">Sort by Newest</option>
            <option value="evidence">Sort by Evidence Score</option>
            <option value="validations">Sort by Validations</option>
          </select>
        </div>

        {error && (
          <div className="rounded-xl bg-red-900/50 p-4 text-sm font-medium text-red-200 border border-red-800 mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 max-w-2xl mx-auto">
            <CheckCircle2 className="mx-auto w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No civic cases yet</h3>
            <p className="text-slate-400 mb-6">
              Citizen reports will appear here for review, routing, escalation, and resolution.
            </p>
            <Link to="/issues" className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
              View Public Board
            </Link>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 max-w-2xl mx-auto">
            <CheckCircle2 className="mx-auto w-12 h-12 text-slate-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No civic cases match the selected filters.</h3>
            <p className="text-slate-400">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 mt-8 w-full min-w-0">
            {filteredReports.map((report) => (
              <div key={report.id} className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/40 p-4 sm:p-5 lg:p-6 transition-all hover:bg-slate-800/60">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[120px_minmax(0,1fr)_180px]">
                  
                  {/* Left: Image */}
                  <div className="h-44 w-full sm:h-52 lg:h-28 lg:w-28 overflow-hidden rounded-2xl bg-slate-800 shrink-0 border border-slate-700">
                    <img src={report.imageUrl || report.imageDataUrlPreview || ""} alt="" className="h-full w-full object-cover opacity-80" />
                  </div>

                  {/* Middle: Info */}
                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="font-semibold text-white break-words line-clamp-2 text-base sm:text-lg mb-2" title={report.title}>{report.title || "Untitled"}</div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-2">
                      <IssueTypeBadge type={report.issueType} />
                      <StatusBadge status={report.status} />
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <span className={`font-bold ${report.priorityScore >= 80 ? 'text-red-500' : report.priorityScore >= 50 ? 'text-yellow-500' : 'text-blue-500'}`}>
                          Pri: {report.priorityScore || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <span className="font-bold text-blue-400">
                          Evi: {report.evidenceScore || 0}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                        <span className="font-bold text-orange-400">
                          Risk: {report.urgency || 0}/5
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-slate-400 break-words line-clamp-2" title={report.address}>
                      {report.address || "No address provided"}
                    </div>
                    <div className="mt-2 text-xs text-slate-500 truncate">
                      {report.department || "Unassigned"} • {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Unknown Date'}
                    </div>
                  </div>
                  
                  {/* Right: Actions */}
                  <div className="flex flex-col gap-3 justify-center w-full mt-2 lg:mt-0 pt-4 lg:pt-0 border-t border-slate-700/50 lg:border-none">
                    <select
                      className="bg-slate-900 border border-slate-700 text-sm rounded-xl px-3 py-2.5 text-white outline-none focus:border-blue-500 disabled:opacity-50 w-full min-w-0"
                      value={report.status}
                      disabled={updatingId === report.id}
                      onChange={(e) => handleUpdateStatus(report.id, e.target.value as IssueStatus)}
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
                    
                    <Link 
                      to={`/admin/issues/${report.id}`}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center w-full"
                    >
                      Review Case <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
