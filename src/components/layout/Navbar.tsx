import { Link, useLocation } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../context/AuthContext";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { user, role, isSignedIn, isAdmin, isCitizen, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine nav links based on role
  const getNavLinks = () => {
    const baseLinks = [
      { name: "Home", path: "/" },
      { name: "Issues", path: "/issues" },
      { name: "Map", path: "/map" },
    ];

    if (isAdmin) {
      return [
        { name: "Home", path: "/" },
        { name: "Issues", path: "/admin/issues" }, // Let's keep it simple for now, maybe just Issues
        { name: "Map", path: "/map" },
        { name: "Admin", path: "/admin" },
      ];
    }

    if (isCitizen) {
      return [
        { name: "Home", path: "/" },
        { name: "Report", path: "/report" },
        { name: "Issues", path: "/issues" },
        { name: "Map", path: "/map" },
        { name: "Dashboard", path: "/dashboard" },
      ];
    }

    // Signed out
    return baseLinks;
  };

  const navLinks = getNavLinks();

  const getInitials = () => {
    if (user?.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/95 backdrop-blur-xl transition-all duration-300",
        isScrolled && "shadow-sm"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 py-3 md:h-20 md:flex-row md:justify-between md:gap-6 md:py-0">
          {/* Logo */}
          <div className="flex w-full justify-center md:w-auto md:flex-1 md:justify-start">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white md:h-9 md:w-9">
                <div className="h-4 w-4 rounded-[4px] border-2 border-white" />
              </div>

              <span className="font-heading text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                CivicLens
              </span>
            </Link>
          </div>

          {/* Nav Links - always visible */}
          <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 md:w-auto md:flex-nowrap md:gap-7">
            {navLinks.map((link) => {
              const active = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "text-sm font-semibold transition-colors hover:text-blue-600 md:text-[15px]",
                    active ? "text-blue-600" : "text-slate-800"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Auth Actions - always visible */}
          <div className="flex w-full items-center justify-center gap-3 md:w-auto md:flex-1 md:justify-end">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link
                  to={isAdmin ? "/admin" : "/dashboard"}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 md:h-10 md:w-10"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials()
                  )}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 hover:border-red-200 md:h-10 md:w-10"
                  title="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100"
                >
                  Log in
                </Link>

                <Link
                  to="/login"
                  className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-600 active:translate-y-0"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}