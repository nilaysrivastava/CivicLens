import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function SignedInRoute() {
  const { isSignedIn, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function CitizenRoute() {
  const { isSignedIn, isAdmin, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { isSignedIn, isAdmin, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="font-heading font-medium text-slate-500">Loading...</p>
      </div>
    </div>
  );
}
