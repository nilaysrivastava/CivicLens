import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-civic-surface border-t border-civic-border py-12 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 group mb-4">
              <div className="w-8 h-8 rounded-lg bg-civic-primary flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <span className="font-heading font-semibold text-xl tracking-tight text-civic-main">
                CivicLens
              </span>
            </Link>
            <p className="text-civic-muted text-sm max-w-sm">
              Turn local issues into verified civic action. 
              Powered by community reporting and AI verification.
            </p>
          </div>
          <div>
            <h3 className="font-heading font-medium text-civic-main mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><Link to="/report" className="text-sm text-civic-muted hover:text-civic-primary transition-colors">Report Issue</Link></li>
              <li><Link to="/issues" className="text-sm text-civic-muted hover:text-civic-primary transition-colors">Public Board</Link></li>
              <li><Link to="/map" className="text-sm text-civic-muted hover:text-civic-primary transition-colors">Civic Map</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-heading font-medium text-civic-main mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="#" className="text-sm text-civic-muted hover:text-civic-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="#" className="text-sm text-civic-muted hover:text-civic-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-civic-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-civic-muted">
            &copy; {new Date().getFullYear()} CivicLens. Civic intelligence for safer, cleaner neighborhoods.
          </p>
        </div>
      </div>
    </footer>
  );
}
