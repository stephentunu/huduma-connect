-- Create huduma_centres table
CREATE TABLE public.huduma_centres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  operating_hours_start TIME NOT NULL DEFAULT '08:00',
  operating_hours_end TIME NOT NULL DEFAULT '17:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  max_daily_appointments INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('pending', 'approved', 'rescheduled', 'cancelled', 'completed', 'no_show');

-- Create service types enum
CREATE TYPE public.service_type AS ENUM ('id_application', 'id_replacement', 'id_collection');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_id UUID NOT NULL,
  centre_id UUID NOT NULL REFERENCES public.huduma_centres(id) ON DELETE CASCADE,
  service_type service_type NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  queue_number INTEGER,
  estimated_wait_minutes INTEGER,
  notes TEXT,
  staff_notes TEXT,
  rescheduled_date DATE,
  rescheduled_time TIME,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create queue tracking table
CREATE TABLE public.appointment_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  centre_id UUID NOT NULL REFERENCES public.huduma_centres(id) ON DELETE CASCADE,
  queue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_queue_number INTEGER NOT NULL DEFAULT 0,
  average_service_time_minutes INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(centre_id, queue_date)
);

-- Enable RLS
ALTER TABLE public.huduma_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_queue ENABLE ROW LEVEL SECURITY;

-- Huduma centres policies (public read)
CREATE POLICY "Anyone can view active centres"
  ON public.huduma_centres FOR SELECT
  USING (is_active = true);

CREATE POLICY "Staff can manage centres"
  ON public.huduma_centres FOR ALL
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- Appointments policies
CREATE POLICY "Citizens can view their own appointments"
  ON public.appointments FOR SELECT
  USING (auth.uid() = citizen_id);

CREATE POLICY "Citizens can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = citizen_id AND public.has_role(auth.uid(), 'citizen'));

CREATE POLICY "Citizens can cancel their appointments"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = citizen_id AND status = 'pending');

CREATE POLICY "Staff can view all appointments"
  ON public.appointments FOR SELECT
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can manage appointments"
  ON public.appointments FOR UPDATE
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- Queue policies
CREATE POLICY "Anyone can view queue"
  ON public.appointment_queue FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage queue"
  ON public.appointment_queue FOR ALL
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- Insert default Huduma centres
INSERT INTO public.huduma_centres (name, location) VALUES
  ('Nairobi Huduma Centre', 'GPO Building, Kenyatta Avenue, Nairobi'),
  ('Mombasa Huduma Centre', 'Treasury Square, Mombasa'),
  ('Kisumu Huduma Centre', 'Mega Plaza, Kisumu'),
  ('Nakuru Huduma Centre', 'Nakuru Town, Nakuru'),
  ('Eldoret Huduma Centre', 'Uganda Road, Eldoret');

-- Create trigger for updated_at
CREATE TRIGGER update_huduma_centres_updated_at
  BEFORE UPDATE ON public.huduma_centres
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_queue_updated_at
  BEFORE UPDATE ON public.appointment_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get next queue number
CREATE OR REPLACE FUNCTION public.get_next_queue_number(p_centre_id UUID, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  INSERT INTO public.appointment_queue (centre_id, queue_date, current_queue_number)
  VALUES (p_centre_id, p_date, 1)
  ON CONFLICT (centre_id, queue_date)
  DO UPDATE SET current_queue_number = appointment_queue.current_queue_number + 1
  RETURNING current_queue_number INTO next_number;
  
  RETURN next_number;
END;
$$;

-- Function to calculate estimated wait time
CREATE OR REPLACE FUNCTION public.calculate_wait_time(p_centre_id UUID, p_queue_number INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_time INTEGER;
  current_num INTEGER;
BEGIN
  SELECT average_service_time_minutes, current_queue_number 
  INTO avg_time, current_num
  FROM public.appointment_queue
  WHERE centre_id = p_centre_id AND queue_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  RETURN GREATEST(0, (p_queue_number - current_num) * avg_time);
END;
$$;