import { ReactNode, useEffect, useState } from "react";
import { Shield, Home, UserPlus, Users, Upload, Settings, CalendarDays, BarChart3 } from "lucide-react";
import { NavLink } from "./NavLink";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

const CustomNavLink = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => {
  return (
    <NavLink
      to={to}
      className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      activeClassName="text-primary border-b-2 border-primary"
    >
      <Icon className="h-4 w-4" />
      {children}
    </NavLink>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setIsAdmin(roles?.some((r) => r.role === "admin") || false);
  };

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

      {/* Navigation */}
      <nav className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 flex-wrap">
            <CustomNavLink to="/dashboard" icon={Home}>Dashboard</CustomNavLink>
            <CustomNavLink to="/register" icon={UserPlus}>Register</CustomNavLink>
            <CustomNavLink to="/applicants" icon={Users}>Applicants</CustomNavLink>
            <CustomNavLink to="/appointments" icon={CalendarDays}>Appointments</CustomNavLink>
            <CustomNavLink to="/id-upload" icon={Upload}>Upload IDs</CustomNavLink>
            <CustomNavLink to="/analytics" icon={BarChart3}>Analytics</CustomNavLink>
            {isAdmin && (
              <CustomNavLink to="/admin" icon={Settings}>Admin</CustomNavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Republic of Kenya - Huduma Centre. All
              rights reserved.
            </p>
            <div className="flex gap-6">
              <NavLink
                to="/about"
                className="hover:text-primary transition-colors"
              >
                About Us
              </NavLink>
              <NavLink
                to="/contact"
                className="hover:text-primary transition-colors"
              >
                Contact Us
              </NavLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;
