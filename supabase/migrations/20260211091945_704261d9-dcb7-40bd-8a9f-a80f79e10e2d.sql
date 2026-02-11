-- Create in-app notifications table
CREATE TABLE public.in_app_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.in_app_notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.in_app_notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Staff/Admin can insert notifications for citizens
CREATE POLICY "Staff can create notifications"
ON public.in_app_notifications
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'staff') OR 
  has_role(auth.uid(), 'admin') OR
  has_role(auth.uid(), 'citizen')
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.in_app_notifications;

-- Create index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.in_app_notifications(user_id, is_read) WHERE is_read = false;