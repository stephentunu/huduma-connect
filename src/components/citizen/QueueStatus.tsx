import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Clock, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type HudumaCentre = Database['public']['Tables']['huduma_centres']['Row'];
type QueueInfo = Database['public']['Tables']['appointment_queue']['Row'];

const QueueStatus = () => {
  const [centres, setCentres] = useState<HudumaCentre[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [todayAppointments, setTodayAppointments] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (selectedCentre) {
      fetchQueueStatus();
    }
  }, [selectedCentre]);

  const fetchCentres = async () => {
    const { data } = await supabase
      .from('huduma_centres')
      .select('*')
      .eq('is_active', true);

    if (data && data.length > 0) {
      setCentres(data);
      setSelectedCentre(data[0].id);
    }
  };

  const fetchQueueStatus = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch queue info
      const { data: queue } = await supabase
        .from('appointment_queue')
        .select('*')
        .eq('centre_id', selectedCentre)
        .eq('queue_date', today)
        .maybeSingle();

      setQueueInfo(queue);

      // Fetch today's appointment count
      const { count } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('centre_id', selectedCentre)
        .eq('appointment_date', today)
        .in('status', ['approved', 'pending']);

      setTodayAppointments(count || 0);
    } catch (error) {
      console.error('Error fetching queue status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCentreData = centres.find(c => c.id === selectedCentre);
  const currentQueueNumber = queueInfo?.current_queue_number || 0;
  const avgServiceTime = queueInfo?.average_service_time_minutes || 15;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-primary flex items-center gap-2">
          <Users className="h-5 w-5" />
          Queue Status
        </CardTitle>
        <CardDescription>Live queue information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Select value={selectedCentre} onValueChange={setSelectedCentre}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select centre" />
            </SelectTrigger>
            <SelectContent>
              {centres.map((centre) => (
                <SelectItem key={centre.id} value={centre.id}>
                  {centre.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchQueueStatus}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {selectedCentreData && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {selectedCentreData.location}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-primary">{currentQueueNumber}</p>
            <p className="text-xs text-muted-foreground">Current Queue</p>
          </div>
          <div className="bg-accent/10 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-accent-foreground">{todayAppointments}</p>
            <p className="text-xs text-muted-foreground">Today's Appointments</p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Avg. Service Time</p>
            <p className="text-xs text-muted-foreground">{avgServiceTime} minutes per person</p>
          </div>
        </div>

        {selectedCentreData && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground mb-2">Operating Hours</p>
            <Badge variant="outline">
              {selectedCentreData.operating_hours_start.slice(0, 5)} - {selectedCentreData.operating_hours_end.slice(0, 5)}
            </Badge>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Book an appointment to skip the queue!
        </p>
      </CardContent>
    </Card>
  );
};

export default QueueStatus;