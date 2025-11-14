import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Users, IdCard, Send, CheckCircle2, LogOut, UserPlus, FileUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplicants: 0,
    registered: 0,
    ready: 0,
    collected: 0,
    notificationsSent: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch applicant stats
      const { data: applicants, error: applicantsError } = await supabase
        .from("applicants")
        .select("status");

      if (applicantsError) throw applicantsError;

      const statusCounts = {
        registered: 0,
        ready: 0,
        collected: 0,
      };

      applicants?.forEach((applicant) => {
        if (applicant.status in statusCounts) {
          statusCounts[applicant.status as keyof typeof statusCounts]++;
        }
      });

      // Fetch notifications sent
      const { count: notificationCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .in("status", ["sent", "delivered"]);

      setStats({
        totalApplicants: applicants?.length || 0,
        registered: statusCounts.registered,
        ready: statusCounts.ready,
        collected: statusCounts.collected,
        notificationsSent: notificationCount || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error fetching statistics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              National ID Notification System Overview
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applicants
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {loading ? "..." : stats.totalApplicants}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All registered applicants
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-status-registered">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered</CardTitle>
              <UserPlus className="h-5 w-5 text-status-registered" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : stats.registered}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting ID issuance
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-status-ready">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready for Collection</CardTitle>
              <IdCard className="h-5 w-5 text-status-ready" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : stats.ready}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                IDs ready to collect
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Notifications Sent
              </CardTitle>
              <Send className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {loading ? "..." : stats.notificationsSent}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                SMS & Email delivered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Button
              className="h-24 bg-primary hover:bg-primary/90 flex flex-col items-center justify-center space-y-2"
              onClick={() => navigate("/register")}
            >
              <UserPlus className="h-8 w-8" />
              <span className="text-base">Register New Applicant</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 border-primary text-primary hover:bg-primary/5"
              onClick={() => navigate("/applicants")}
            >
              <IdCard className="h-8 w-8" />
              <span className="text-base">View All Applicants</span>
            </Button>
          </CardContent>
        </Card>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-status-registered" />
                <span className="text-sm font-medium">Registered</span>
              </div>
              <span className="text-sm font-bold">{stats.registered}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-status-ready" />
                <span className="text-sm font-medium">Ready for Collection</span>
              </div>
              <span className="text-sm font-bold">{stats.ready}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-status-collected" />
                <span className="text-sm font-medium">Collected</span>
              </div>
              <span className="text-sm font-bold">{stats.collected}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
