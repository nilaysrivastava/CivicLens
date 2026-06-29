import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listReports } from "../lib/firebaseReports";
import { Report } from "../types/report";
import { ShieldAlert, AlertTriangle, FileText, CheckCircle2, Clock, Activity, BarChart, ArrowRight, Loader2, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { seedCivicCases } from "../lib/seedData";

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#64748b'];

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await listReports();
        setReports(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleSeedData = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      await seedCivicCases();
      const data = await listReports();
      setReports(data);
    } catch (error) {
      console.error(error);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Stats
  const total = reports.length;
  const newReports = reports.filter(r => r.status === "reported").length;
  const aiVerified = reports.filter(r => r.confidence >= 0.5 && r.status === "verified").length;
  const manualReview = reports.filter(r => r.confidence < 0.5 && r.status === "reported").length;
  const highPriority = reports.filter(r => r.priorityScore >= 70 && r.priorityScore < 90).length;
  const criticalPriority = reports.filter(r => r.priorityScore >= 90).length;
  const inProgress = reports.filter(r => r.status === "in_progress").length;
  const resolved = reports.filter(r => r.status === "resolved").length;
  const escalated = reports.filter(r => r.status === "escalated").length;
  
  const avgEvidence = total > 0 ? Math.round(reports.reduce((acc, r) => acc + (r.evidenceScore || 0), 0) / total) : 0;
  const avgPriority = total > 0 ? Math.round(reports.reduce((acc, r) => acc + (r.priorityScore || 0), 0) / total) : 0;

  // Chart Data
  const typeCount: Record<string, number> = {};
  const statusCount: Record<string, number> = {};
  const deptCount: Record<string, number> = {};
  
  reports.forEach(r => {
    typeCount[r.issueType] = (typeCount[r.issueType] || 0) + 1;
    statusCount[r.status] = (statusCount[r.status] || 0) + 1;
    deptCount[r.department || "Unassigned"] = (deptCount[r.department || "Unassigned"] || 0) + 1;
  });

  const typeData = Object.entries(typeCount).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const statusData = Object.entries(statusCount).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const deptData = Object.entries(deptCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  
  const priorityData = [
    { name: 'Low', value: reports.filter(r => r.priorityScore < 40).length },
    { name: 'Medium', value: reports.filter(r => r.priorityScore >= 40 && r.priorityScore < 70).length },
    { name: 'High', value: reports.filter(r => r.priorityScore >= 70 && r.priorityScore < 90).length },
    { name: 'Critical', value: reports.filter(r => r.priorityScore >= 90).length },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold tracking-tight text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-500" />
              Civic Operations Command Center
            </h1>
            <p className="mt-2 text-slate-400">
              Civic overview and intelligence dashboard.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center gap-2 border border-slate-700"
            >
              {seeding ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
              {seeding ? "Seeding..." : "Seed Cases"}
            </button>
            <Link to="/admin/issues" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2">
              Open Case Queue <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Reports</div>
            <div className="text-3xl font-bold text-white">{total}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">New</div>
            <div className="text-3xl font-bold text-blue-400">{newReports}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">AI Verified</div>
            <div className="text-3xl font-bold text-green-400">{aiVerified}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Manual Review</div>
            <div className="text-3xl font-bold text-yellow-400">{manualReview}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-3xl font-bold text-indigo-400">{inProgress}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Resolved</div>
            <div className="text-3xl font-bold text-emerald-400">{resolved}</div>
          </div>
        </div>

        {/* Priority & Urgency */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-orange-900/20 p-5 rounded-2xl border border-orange-800/50">
            <div className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldAlert size={14} /> High Priority</div>
            <div className="text-3xl font-bold text-orange-400">{highPriority}</div>
          </div>
          <div className="bg-red-900/20 p-5 rounded-2xl border border-red-800/50">
            <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1"><AlertTriangle size={14} /> Critical</div>
            <div className="text-3xl font-bold text-red-400">{criticalPriority}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
            <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Escalated</div>
            <div className="text-3xl font-bold text-orange-500">{escalated}</div>
          </div>
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 flex flex-col justify-center">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Avg Evidence</span>
              <span className="text-blue-400 font-bold">{avgEvidence}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Avg Priority</span>
              <span className="text-green-400 font-bold">{avgPriority}</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96">
            <h3 className="text-lg font-bold text-white mb-6">Reports by Issue Type</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {typeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96">
            <h3 className="text-lg font-bold text-white mb-6">Status Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label>
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96">
            <h3 className="text-lg font-bold text-white mb-6">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#f97316', '#ef4444'][index % 4]} />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-96">
            <h3 className="text-lg font-bold text-white mb-6">Department Workload</h3>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={deptData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" />
                <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
