import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../lib/firebaseReports";
import { Report } from "../types/report";
import { StatusBadge, IssueTypeBadge, SafetyRiskBadge } from "../components/ui/Badges";
import { MapPin, Search, Calendar, ChevronRight } from "lucide-react";

export default function Issues() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await listReports();
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
        setError("Failed to load issues.");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const filteredReports = reports.filter((report) => 
    report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-slate-900">
              Civic Issues Board
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Community-reported issues, sorted by recent activity.
            </p>
          </div>
          
          <div className="w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-80 rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No issues found</h3>
            <p className="text-slate-500">
              {searchQuery ? "Try adjusting your search terms." : "There are currently no reported issues."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Link 
                key={report.id} 
                to={`/issues/${report.id}`}
                className="group flex flex-col bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="relative h-48 w-full bg-slate-100">
                  <img 
                    src={report.imageUrl || report.imageDataUrlPreview} 
                    alt={report.title} 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <StatusBadge status={report.status} />
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-slate-700 shadow-sm flex items-center gap-1">
                    👍 {report.validationCount}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <IssueTypeBadge type={report.issueType} />
                    <SafetyRiskBadge risk={report.safetyRisk} />
                    {report.duplicateCount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {report.duplicateCount} Clustered
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {report.title || `${report.issueType} reported at ${report.address}`}
                  </h3>
                  
                  <div className="flex items-start gap-2 text-sm text-slate-500 mb-4">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">{report.address}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Priority</div>
                      <div className={`text-sm font-bold ${report.priorityScore >= 60 ? 'text-red-600' : 'text-slate-700'}`}>{report.priorityScore}/100</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Evidence</div>
                      <div className="text-sm font-bold text-slate-700">{report.evidenceScore}%</div>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleDateString() : "Recently"}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-600 truncate max-w-[120px]">
                        To: {report.department}
                      </div>
                    </div>
                    <div className="flex items-center text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                      View
                      <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
