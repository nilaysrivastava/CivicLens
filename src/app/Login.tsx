import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginWithEmail, signupWithEmail, loginWithGoogle } from "../lib/auth";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, ArrowRight, Loader2, Mail } from "lucide-react";

export default function Login() {
  const { isSignedIn, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (authLoading) return null;

  if (isSignedIn) {
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (demoWorkspace?: "citizen" | "admin") => {
    setError("");
    setLoading(true);

    if (demoWorkspace) {
      sessionStorage.setItem("demoWorkspace", demoWorkspace);
    }

    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in with Google");
      sessionStorage.removeItem("demoWorkspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid w-full max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Value Prop */}
        <div className="flex min-h-[320px] w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-blue-600 p-6 text-white shadow-sm sm:p-8 lg:min-h-[680px] lg:p-12">
          <div className="pointer-events-none absolute opacity-10" />

          <div className="relative z-10 flex flex-col items-start">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-blue-500/30 p-3 lg:mb-8">
              <ShieldCheck className="h-7 w-7 text-blue-100 lg:h-8 lg:w-8" />
            </div>

            <h1 className="mb-4 max-w-xl text-balance font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:mb-6">
              Join the movement for transparent, responsive civic action.
            </h1>

            <p className="max-w-md text-sm leading-6 text-blue-100 sm:text-base lg:text-lg">
              CivicLens empowers citizens to report issues, track real-world
              resolutions, and improve their communities through data.
            </p>
          </div>

          <div className="relative z-10 mt-10">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-800 text-xs font-medium"
                  >
                    U{i}
                  </div>
                ))}
              </div>

              <p className="text-sm font-medium text-blue-100">
                Trusted civic reporting workspace
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex w-full items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-heading text-3xl font-semibold tracking-tight text-slate-900">
                {isLogin ? "Welcome back" : "Create an account"}
              </h2>

              <p className="text-sm text-slate-500">
                {isLogin
                  ? "Enter your details to access your dashboard."
                  : "Join CivicLens to start making an impact."}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm sm:p-8">
              {error && (
                <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label
                      className="mb-1.5 block text-sm font-semibold text-slate-700"
                      htmlFor="name"
                    >
                      Full Name
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      placeholder="Jane Doe"
                      required={!isLogin}
                      disabled={loading}
                    />
                  </div>
                )}

                <div>
                  <label
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                    htmlFor="email"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? "Sign in" : "Create account"}
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-slate-200" />
                <span className="mx-4 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                  Or continue with
                </span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => handleGoogleAuth()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2 disabled:opacity-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </button>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </p>

            <div className="mx-auto mt-8 w-full rounded-3xl border border-slate-200/60 bg-slate-100/60 p-5">
              <div className="mb-4 text-center">
                <h3 className="mb-1 text-sm font-bold text-slate-900">
                  Judge Access
                </h3>

                <p className="mx-auto max-w-sm text-xs leading-5 text-slate-500">
                  Sign in with Google, then choose the demo workspace using the
                  access code below.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    Citizen Workspace
                  </h4>

                  <div className="mb-1 text-[11px] font-mono text-slate-500">
                    Access Code
                  </div>

                  <div className="mb-3 break-words text-[11px] font-semibold text-slate-900">
                    CIVIC-CITIZEN-2026
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuth("citizen")}
                    disabled={loading}
                    className="w-full rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                  >
                    Continue as Citizen Demo
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm">
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
                    Operations Workspace
                  </h4>

                  <div className="mb-1 text-[11px] font-mono text-slate-500">
                    Access Code
                  </div>

                  <div className="mb-3 break-words text-[11px] font-semibold text-slate-900">
                    CIVIC-ADMIN-2026
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleAuth("admin")}
                    disabled={loading}
                    className="w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-900 disabled:opacity-50"
                  >
                    Continue as Admin Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}