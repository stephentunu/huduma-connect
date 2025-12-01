-- Add created_by column to profiles table to track which admin created each user
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by);

-- Update the handle_new_user function to capture who created the user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, center_name, email, created_by)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Staff User'),
    COALESCE(new.raw_user_meta_data->>'center_name', 'Nairobi Huduma Centre'),
    new.email,
    (new.raw_user_meta_data->>'created_by')::uuid
  );
  
  -- Assign default staff role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;