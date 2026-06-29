import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import LandingPage from './app/LandingPage';
import Login from './app/Login';
import Report from './app/Report';
import Issues from './app/Issues';
import MapPage from './app/Map';
import Dashboard from './app/Dashboard';
import AdminDashboard from './app/AdminDashboard';
import AdminIssues from './app/AdminIssues';
import IssueDetail from './app/IssueDetail';
import AdminIssueDetail from './app/AdminIssueDetail';
import { AuthProvider } from './context/AuthContext';
import { CitizenRoute, AdminRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout>
          <Routes>
            {/* Public / Read-Only Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            
            {/* Citizen Routes */}
            <Route element={<CitizenRoute />}>
              <Route path="/report" element={<Report />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/issues" element={<AdminIssues />} />
              <Route path="/admin/issues/:id" element={<AdminIssueDetail />} />
            </Route>
          </Routes>
        </MainLayout>
      </Router>
    </AuthProvider>
  );
}
