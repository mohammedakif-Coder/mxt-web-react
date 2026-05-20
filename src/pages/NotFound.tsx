import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-ios-fade-in space-y-4">
        <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
          <span className="text-3xl font-bold text-primary">404</span>
        </div>
        <h1 className="text-xl font-bold text-foreground">Page not found</h1>
        <p className="text-[13px] text-muted-foreground">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block text-[13px] text-primary hover:text-primary/80 font-medium transition-colors ios-press">
          ← Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
