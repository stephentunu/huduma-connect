import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarDays, Clock, MapPin, Check } from "lucide-react";
import { format, addDays, isBefore, isWeekend } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type HudumaCentre = Database['public']['Tables']['huduma_centres']['Row'];
type ServiceType = Database['public']['Enums']['service_type'];

interface AppointmentBookingProps {
  userId: string;
  onBack: () => void;
}

const AppointmentBooking = ({ userId, onBack }: AppointmentBookingProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [centres, setCentres] = useState<HudumaCentre[]>([]);
  const [selectedCentre, setSelectedCentre] = useState<string>("");
  const [selectedService, setSelectedService] = useState<ServiceType | "">("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCentres();
  }, []);

  useEffect(() => {
    if (selectedCentre && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedCentre, selectedDate]);

  const fetchCentres = async () => {
    const { data, error } = await supabase
      .from('huduma_centres')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setCentres(data);
    }
  };

  const fetchAvailableSlots = async () => {
    const centre = centres.find(c => c.id === selectedCentre);
    if (!centre || !selectedDate) return;

    // Generate time slots based on centre operating hours
    const slots: string[] = [];
    const startHour = parseInt(centre.operating_hours_start.split(':')[0]);
    const endHour = parseInt(centre.operating_hours_end.split(':')[0]);
    const slotDuration = centre.slot_duration_minutes;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }

    // Fetch already booked slots for this date and centre
    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('centre_id', selectedCentre)
      .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
      .in('status', ['pending', 'approved']);

    const bookedTimes = booked?.map(b => b.appointment_time.slice(0, 5)) || [];
    setBookedSlots(bookedTimes);
    setAvailableSlots(slots);
    setSelectedTime("");
  };

  const isSlotAvailable = (slot: string) => !bookedSlots.includes(slot);

  const handleSubmit = async () => {
    if (!selectedCentre || !selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          citizen_id: userId,
          centre_id: selectedCentre,
          service_type: selectedService,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime + ':00',
          notes: notes || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Appointment booked!",
        description: "Your appointment has been submitted for approval. You'll receive an email once approved.",
      });
      onBack();
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || isWeekend(date);
  };

  const selectedCentreData = centres.find(c => c.id === selectedCentre);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              <CalendarDays className="h-6 w-6" />
              Book Appointment
            </CardTitle>
            <CardDescription>
              Schedule your visit to a Huduma Centre
            </CardDescription>
            
            {/* Progress Steps */}
            <div className="flex justify-between mt-4 relative">
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className="text-xs mt-1 text-muted-foreground">
                    {s === 1 ? 'Service' : s === 2 ? 'Date & Time' : 'Confirm'}
                  </span>
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {/* Step 1: Select Service & Centre */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Huduma Centre</Label>
                  <Select value={selectedCentre} onValueChange={setSelectedCentre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a centre" />
                    </SelectTrigger>
                    <SelectContent>
                      {centres.map((centre) => (
                        <SelectItem key={centre.id} value={centre.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            {centre.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCentreData && (
                    <p className="text-sm text-muted-foreground">
                      {selectedCentreData.location}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Select Service</Label>
                  <Select value={selectedService} onValueChange={(v) => setSelectedService(v as ServiceType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="What do you need?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id_application">
                        National ID Application
                      </SelectItem>
                      <SelectItem value="id_replacement">
                        ID Replacement (Lost/Damaged)
                      </SelectItem>
                      <SelectItem value="id_collection">
                        ID Collection
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setStep(2)}
                  disabled={!selectedCentre || !selectedService}
                >
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={disabledDays}
                      fromDate={new Date()}
                      toDate={addDays(new Date(), 30)}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-2">
                    <Label>Select Time Slot</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedTime === slot ? "default" : "outline"}
                          size="sm"
                          disabled={!isSlotAvailable(slot)}
                          onClick={() => setSelectedTime(slot)}
                          className={!isSlotAvailable(slot) ? "opacity-50 line-through" : ""}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                    {bookedSlots.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Crossed-out slots are already booked
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-primary">Appointment Summary</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Centre:</span>
                      <span className="font-medium">{selectedCentreData?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">
                        {selectedService === 'id_application' ? 'ID Application' :
                         selectedService === 'id_replacement' ? 'ID Replacement' : 'ID Collection'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special requirements or information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                  <p className="text-sm text-accent-foreground">
                    <strong>Note:</strong> Your appointment will be pending until approved by Huduma Centre staff. 
                    You'll receive an email notification once approved.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-primary"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AppointmentBooking;