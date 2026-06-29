import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listReportsByUser } from "../lib/firebaseReports";
import { Report } from "../types/report";
import { StatusBadge, IssueTypeBadge } from "../components/ui/Badges";
import { FileText, CheckCircle2, Clock, MapPin, Plus, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReports() {
      if (!user) return;
      try {
        const data = await listReportsByUser(user.uid);
        const sortedData = data.sort((a, b) => {
          if (b.priorityScore !== a.priorityScore) {
            return b.priorityScore - a.priorityScore;
          }
          const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bTime - aTime;
        });
        setReports(sortedData);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load your reports.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, [user]);

  const stats = {
    total: reports.length,
    reported: reports.filter(r => r.status === "reported").length,
    verified: reports.filter(r => r.status === "verified").length,
    inProgress: reports.filter(r => r.status === "in_progress").length,
    resolved: reports.filter(r => r.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
              My CivicLens Dashboard
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Track the status of your reported issues and community validations.
            </p>
          </div>
          
          <Link
            to="/report"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 hover:-translate-y-0.5 shadow-sm active:translate-y-0"
          >
            <Plus size={18} />
            Report new issue
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 mb-8">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-slate-900 mb-1">{stats.total}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</span>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-yellow-600 mb-1">{stats.reported}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reported</span>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-blue-600 mb-1">{stats.verified}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified</span>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-purple-600 mb-1">{stats.inProgress}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold text-green-600 mb-1">{stats.resolved}</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Resolved</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-sm max-w-2xl mx-auto">
            <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No reports yet</h3>
            <p className="text-slate-600 mb-8">
              Your submitted civic reports will appear here. Start by reporting a local issue with photo proof. Your reports help city officials prioritize repairs.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-sm"
            >
              <Plus size={18} />
              Report your first issue
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/60">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Issue</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">AI Priority</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                            <img src={report.imageUrl || report.imageDataUrlPreview} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 mb-1">{report.title}</div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <IssueTypeBadge type={report.issueType} />
                              <span className="hidden sm:inline-flex items-center gap-1">
                                <MapPin size={12} />
                                <span className="truncate max-w-[150px]">{report.address}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={report.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-sm font-semibold text-slate-900">{report.priorityScore}/100</div>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${report.priorityScore}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                          <Clock size={14} />
                          {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : 'Recently'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/issues/${report.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 group-hover:translate-x-1 transition-transform"
                        >
                          View <ArrowRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
