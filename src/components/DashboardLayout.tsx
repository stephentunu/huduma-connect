import { ReactNode } from "react";
import { Shield } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg border-b-4 border-accent">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-3">
          <div className="bg-accent text-accent-foreground rounded-full p-2">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Huduma Centre</h1>
            <p className="text-xs text-primary-foreground/80">
              National ID Notification System
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Republic of Kenya - Huduma Centre. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
