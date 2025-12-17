import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, Clock, MapPin, LogOut, Plus, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import AppointmentBooking from "@/components/citizen/AppointmentBooking";
import QueueStatus from "@/components/citizen/QueueStatus";
import type { Database } from "@/integrations/supabase/types";

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  huduma_centres?: { name: string; location: string } | null;
};

const CitizenDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/citizen-auth");
      return;
    }

    // Check if user has citizen role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);

    if (!roles?.some(r => r.role === 'citizen')) {
      toast({
        title: "Access denied",
        description: "This portal is for citizens only.",
        variant: "destructive",
      });
      await supabase.auth.signOut();
      navigate("/citizen-auth");
      return;
    }

    setUserId(session.user.id);
    fetchAppointments(session.user.id);
  };

  const fetchAppointments = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          huduma_centres (name, location)
        `)
        .eq('citizen_id', uid)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/citizen-auth");
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Appointment cancelled",
        description: "Your appointment has been cancelled.",
      });

      if (userId) fetchAppointments(userId);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending Approval" },
      approved: { variant: "default", label: "Approved" },
      rescheduled: { variant: "outline", label: "Rescheduled" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      completed: { variant: "default", label: "Completed" },
      no_show: { variant: "destructive", label: "No Show" },
    };
    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      id_application: "ID Application",
      id_replacement: "ID Replacement",
      id_collection: "ID Collection",
    };
    return labels[service] || service;
  };

  const upcomingAppointments = appointments.filter(
    a => ['pending', 'approved', 'rescheduled'].includes(a.status) && 
    new Date(a.appointment_date) >= new Date(new Date().setHours(0,0,0,0))
  );

  const pastAppointments = appointments.filter(
    a => !['pending', 'approved', 'rescheduled'].includes(a.status) ||
    new Date(a.appointment_date) < new Date(new Date().setHours(0,0,0,0))
  );

  if (showBooking) {
    return (
      <AppointmentBooking 
        userId={userId!}
        onBack={() => {
          setShowBooking(false);
          if (userId) fetchAppointments(userId);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 shadow-lg">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">Citizen Portal</h1>
              <p className="text-sm text-primary-foreground/80">Huduma Centre Appointments</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button 
            onClick={() => setShowBooking(true)}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
          <Button 
            variant="outline" 
            onClick={() => userId && fetchAppointments(userId)}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Appointments Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => setShowBooking(true)}
                    >
                      Book your first appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments.map((apt) => (
                      <div 
                        key={apt.id} 
                        className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-primary">
                              {getServiceLabel(apt.service_type)}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {apt.huduma_centres?.name}
                            </p>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4 text-primary" />
                            {format(new Date(apt.appointment_date), "EEE, MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-primary" />
                            {apt.status === 'rescheduled' && apt.rescheduled_time 
                              ? apt.rescheduled_time.slice(0, 5)
                              : apt.appointment_time.slice(0, 5)}
                          </span>
                        </div>

                        {apt.status === 'rescheduled' && apt.rescheduled_date && (
                          <p className="text-sm text-accent font-medium mb-2">
                            Rescheduled to: {format(new Date(apt.rescheduled_date), "MMM d, yyyy")} at {apt.rescheduled_time?.slice(0, 5)}
                          </p>
                        )}

                        {apt.queue_number && (
                          <p className="text-sm font-medium">
                            Queue #: <span className="text-primary">{apt.queue_number}</span>
                          </p>
                        )}

                        {apt.status === 'pending' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-3"
                            onClick={() => handleCancelAppointment(apt.id)}
                          >
                            Cancel Appointment
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground">Past Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastAppointments.slice(0, 5).map((apt) => (
                      <div 
                        key={apt.id} 
                        className="border rounded-lg p-3 bg-muted/30 opacity-75"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{getServiceLabel(apt.service_type)}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(apt.appointment_date), "MMM d, yyyy")} - {apt.huduma_centres?.name}
                            </p>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Queue Status Sidebar */}
          <div>
            <QueueStatus />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Republic of Kenya - Huduma Centre</p>
        </div>
      </footer>
    </div>
  );
};

export default CitizenDashboard;