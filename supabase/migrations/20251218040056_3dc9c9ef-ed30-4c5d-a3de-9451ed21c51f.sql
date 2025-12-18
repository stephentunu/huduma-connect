-- Create a trigger function to handle citizen registration
CREATE OR REPLACE FUNCTION public.handle_citizen_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only handle if the user metadata indicates they are a citizen
  IF new.raw_user_meta_data->>'role' = 'citizen' THEN
    -- Insert citizen role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, 'citizen')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;

-- Create trigger for citizen signup (runs after the existing handle_new_user trigger if any)
DROP TRIGGER IF EXISTS on_citizen_signup ON auth.users;
CREATE TRIGGER on_citizen_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_citizen_signup();