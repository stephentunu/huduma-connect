import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Check, X, Clock, RefreshCw, Search, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/DashboardLayout";
import type { Database } from "@/integrations/supabase/types";

type Appointment = Database['public']['Tables']['appointments']['Row'] & {
  huduma_centres?: { name: string } | null;
};

type AppointmentStatus = Database['public']['Enums']['appointment_status'];

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reschedule">("approve");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [filterStatus]);

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
    }
  };

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          huduma_centres (name)
        `)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (filterStatus !== "all") {
        query = query.eq('status', filterStatus as AppointmentStatus);
      }

      const { data, error } = await query;

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

  const openActionDialog = (appointment: Appointment, action: "approve" | "reschedule") => {
    setSelectedAppointment(appointment);
    setDialogAction(action);
    setNewDate(appointment.appointment_date);
    setNewTime(appointment.appointment_time.slice(0, 5));
    setStaffNotes("");
    setIsDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedAppointment) return;
    setIsProcessing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get next queue number
      const { data: queueNumber } = await supabase.rpc('get_next_queue_number', {
        p_centre_id: selectedAppointment.centre_id,
        p_date: selectedAppointment.appointment_date
      });

      // Update appointment
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'approved',
          approved_by: session?.user.id,
          approved_at: new Date().toISOString(),
          queue_number: queueNumber,
          staff_notes: staffNotes || null,
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      // Send notification
      await supabase.functions.invoke('send-appointment-notification', {
        body: {
          appointmentId: selectedAppointment.id,
          action: 'approved',
          staffNotes,
        }
      });

      toast({
        title: "Appointment approved",
        description: "The citizen will receive an email notification.",
      });

      setIsDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedAppointment || !newDate || !newTime) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: 'rescheduled',
          rescheduled_date: newDate,
          rescheduled_time: newTime + ':00',
          staff_notes: staffNotes || null,
        })
        .eq('id', selectedAppointment.id);

      if (error) throw error;

      // Send notification
      await supabase.functions.invoke('send-appointment-notification', {
        body: {
          appointmentId: selectedAppointment.id,
          action: 'rescheduled',
          newDate,
          newTime: newTime + ':00',
          staffNotes,
        }
      });

      toast({
        title: "Appointment rescheduled",
        description: "The citizen will receive an email notification.",
      });

      setIsDialogOpen(false);
      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (appointment: Appointment) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) throw error;

      toast({
        title: "Appointment rejected",
        description: "The appointment has been cancelled.",
      });

      fetchAppointments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "Pending" },
      approved: { variant: "default", label: "Approved" },
      rescheduled: { variant: "outline", label: "Rescheduled" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      completed: { variant: "default", label: "Completed" },
      no_show: { variant: "destructive", label: "No Show" },
    };
    const c = config[status] || { variant: "outline", label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getServiceLabel = (service: string) => {
    const labels: Record<string, string> = {
      id_application: "ID Application",
      id_replacement: "ID Replacement",
      id_collection: "ID Collection",
    };
    return labels[service] || service;
  };

  const filteredAppointments = appointments.filter(apt => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      apt.citizen_id.toLowerCase().includes(search) ||
      apt.huduma_centres?.name?.toLowerCase().includes(search) ||
      getServiceLabel(apt.service_type).toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Appointments</h1>
            <p className="text-muted-foreground">Manage citizen appointment requests</p>
          </div>
          <Button onClick={fetchAppointments} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Appointments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Appointment Requests ({filteredAppointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredAppointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No appointments found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Centre</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Queue #</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {apt.appointment_time.slice(0, 5)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{apt.huduma_centres?.name}</TableCell>
                      <TableCell>{getServiceLabel(apt.service_type)}</TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
                      <TableCell>
                        {apt.queue_number ? `#${apt.queue_number}` : "-"}
                      </TableCell>
                      <TableCell>
                        {apt.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openActionDialog(apt, "approve")}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog(apt, "reschedule")}
                            >
                              <Clock className="h-4 w-4 mr-1" />
                              Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReject(apt)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        {apt.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionDialog(apt, "reschedule")}
                          >
                            Reschedule
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Approve Appointment" : "Reschedule Appointment"}
            </DialogTitle>
            <DialogDescription>
              {dialogAction === "approve"
                ? "Confirm this appointment and notify the citizen."
                : "Select a new date and time for this appointment."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">
                  <strong>Current:</strong>{" "}
                  {format(new Date(selectedAppointment.appointment_date), "MMM d, yyyy")} at{" "}
                  {selectedAppointment.appointment_time.slice(0, 5)}
                </p>
                <p className="text-sm">
                  <strong>Service:</strong> {getServiceLabel(selectedAppointment.service_type)}
                </p>
              </div>

              {dialogAction === "reschedule" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>New Date</Label>
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>New Time</Label>
                      <Input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Notes for Citizen (optional)</Label>
                <Textarea
                  placeholder={
                    dialogAction === "approve"
                      ? "Any special instructions..."
                      : "Reason for rescheduling..."
                  }
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={dialogAction === "approve" ? handleApprove : handleReschedule}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : dialogAction === "approve" ? "Approve" : "Reschedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default StaffAppointments;