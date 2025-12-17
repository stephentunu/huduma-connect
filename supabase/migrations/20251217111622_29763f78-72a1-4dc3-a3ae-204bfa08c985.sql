-- Add citizen role to enum (this will be committed separately)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'citizen';