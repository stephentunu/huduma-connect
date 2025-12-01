-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, center_name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Staff User'),
    COALESCE(new.raw_user_meta_data->>'center_name', 'Nairobi Huduma Centre'),
    new.email
  );
  
  -- Assign default staff role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'staff');
  
  RETURN new;
END;
$$;

-- Update existing profiles with emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;