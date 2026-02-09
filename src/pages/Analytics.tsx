import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { CalendarDays, Users, Clock, TrendingUp, CheckCircle2, XCircle, FileText } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";

interface AppointmentStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

interface DailyAppointment {
  date: string;
  count: number;
}

interface ServiceDistribution {
  name: string;
  value: number;
}

interface CentreStats {
  name: string;
  appointments: number;
  avgWaitTime: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))', 'hsl(142 76% 36%)', 'hsl(0 84% 60%)'];

const Analytics = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7");
  
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats>({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  });
  
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppointment[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<ServiceDistribution[]>([]);
  const [centreStats, setCentreStats] = useState<CentreStats[]>([]);
  const [applicantStats, setApplicantStats] = useState({
    total: 0,
    registered: 0,
    ready: 0,
    collected: 0,
    collectionRate: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchAnalytics();
    }
  }, [dateRange]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (!roles?.some(r => r.role === 'staff' || r.role === 'admin')) {
      navigate("/auth");
      return;
    }

    fetchAnalytics();
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    const days = parseInt(dateRange);
    const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    
    try {
      // Fetch appointment stats
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('status, service_type, appointment_date, centre_id, estimated_wait_minutes')
        .gte('appointment_date', startDate);

      if (aptError) throw aptError;

      // Calculate appointment statistics
      const stats: AppointmentStats = {
        total: appointments?.length || 0,
        pending: 0,
        approved: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
      };

      const serviceCount: Record<string, number> = {};
      const dailyCount: Record<string, number> = {};
      const centreCount: Record<string, { appointments: number; totalWait: number }> = {};

      appointments?.forEach((apt) => {
        // Status counts
        if (apt.status === 'pending') stats.pending++;
        else if (apt.status === 'approved') stats.approved++;
        else if (apt.status === 'completed') stats.completed++;
        else if (apt.status === 'cancelled') stats.cancelled++;
        else if (apt.status === 'no_show') stats.noShow++;

        // Service distribution
        const serviceName = apt.service_type === 'id_application' ? 'ID Application' 
          : apt.service_type === 'id_replacement' ? 'ID Replacement' 
          : 'ID Collection';
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;

        // Daily appointments
        dailyCount[apt.appointment_date] = (dailyCount[apt.appointment_date] || 0) + 1;

        // Centre stats
        if (!centreCount[apt.centre_id]) {
          centreCount[apt.centre_id] = { appointments: 0, totalWait: 0 };
        }
        centreCount[apt.centre_id].appointments++;
        centreCount[apt.centre_id].totalWait += apt.estimated_wait_minutes || 0;
      });

      setAppointmentStats(stats);

      // Set service distribution
      setServiceDistribution(
        Object.entries(serviceCount).map(([name, value]) => ({ name, value }))
      );

      // Generate daily data for the date range
      const dateInterval = eachDayOfInterval({
        start: subDays(new Date(), days),
        end: new Date(),
      });

      const dailyData = dateInterval.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return {
          date: format(date, 'MMM d'),
          count: dailyCount[dateStr] || 0,
        };
      });
      setDailyAppointments(dailyData);

      // Fetch centre names and calculate stats
      const { data: centres } = await supabase
        .from('huduma_centres')
        .select('id, name');

      const centreStatsData: CentreStats[] = [];
      for (const centreId of Object.keys(centreCount)) {
        const centre = centres?.find(c => c.id === centreId);
        if (centre) {
          const { appointments, totalWait } = centreCount[centreId];
          centreStatsData.push({
            name: centre.name,
            appointments,
            avgWaitTime: appointments > 0 ? Math.round(totalWait / appointments) : 0,
          });
        }
      }
      setCentreStats(centreStatsData.sort((a, b) => b.appointments - a.appointments));

      // Fetch applicant stats
      const { data: applicants, error: appError } = await supabase
        .from('applicants')
        .select('status')
        .gte('created_at', startDate);

      if (appError) throw appError;

      const appStats = {
        total: applicants?.length || 0,
        registered: 0,
        ready: 0,
        collected: 0,
        collectionRate: 0,
      };

      applicants?.forEach((app) => {
        if (app.status === 'registered' || app.status === 'processing') appStats.registered++;
        else if (app.status === 'ready') appStats.ready++;
        else if (app.status === 'collected') appStats.collected++;
      });

      appStats.collectionRate = appStats.total > 0 
        ? Math.round((appStats.collected / appStats.total) * 100) 
        : 0;

      setApplicantStats(appStats);

    } catch (error: any) {
      toast({
        title: "Error loading analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const appointmentCompletionRate = appointmentStats.total > 0 
    ? Math.round((appointmentStats.completed / appointmentStats.total) * 100) 
    : 0;

  const noShowRate = appointmentStats.total > 0 
    ? Math.round((appointmentStats.noShow / appointmentStats.total) * 100) 
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Service performance metrics and insights</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
                  <CalendarDays className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{appointmentStats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    In selected period
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{appointmentCompletionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {appointmentStats.completed} completed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-destructive">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
                  <XCircle className="h-5 w-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{noShowRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {appointmentStats.noShow} no-shows
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-status-collected">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Document Collection</CardTitle>
                  <FileText className="h-5 w-5 text-status-collected" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{applicantStats.collectionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {applicantStats.collected} of {applicantStats.total} collected
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Daily Appointments Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Appointment Trends
                  </CardTitle>
                  <CardDescription>Daily appointment volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyAppointments}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))' }}
                          name="Appointments"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Service Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Service Distribution
                  </CardTitle>
                  <CardDescription>Breakdown by service type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {serviceDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={serviceDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {serviceDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No service data available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Appointment Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Appointment Status Breakdown
                </CardTitle>
                <CardDescription>Current status distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { status: 'Pending', count: appointmentStats.pending },
                      { status: 'Approved', count: appointmentStats.approved },
                      { status: 'Completed', count: appointmentStats.completed },
                      { status: 'Cancelled', count: appointmentStats.cancelled },
                      { status: 'No Show', count: appointmentStats.noShow },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="status" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }} 
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Centre Performance */}
            {centreStats.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Centre Performance
                  </CardTitle>
                  <CardDescription>Appointments and average wait times by centre</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={centreStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" width={150} className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="appointments" fill="hsl(var(--primary))" name="Appointments" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="avgWaitTime" fill="hsl(var(--accent))" name="Avg Wait (min)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Processing Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Documents Registered
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applicantStats.registered}</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-status-registered h-2 rounded-full" 
                      style={{ width: `${applicantStats.total > 0 ? (applicantStats.registered / applicantStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ready for Collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applicantStats.ready}</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-status-ready h-2 rounded-full" 
                      style={{ width: `${applicantStats.total > 0 ? (applicantStats.ready / applicantStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Documents Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applicantStats.collected}</div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-status-collected h-2 rounded-full" 
                      style={{ width: `${applicantStats.total > 0 ? (applicantStats.collected / applicantStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
