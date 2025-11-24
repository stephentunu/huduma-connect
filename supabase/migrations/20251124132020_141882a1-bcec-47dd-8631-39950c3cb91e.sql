-- Create enum for document types
CREATE TYPE document_type AS ENUM (
  'national_id',
  'passport',
  'visa',
  'birth_certificate',
  'driving_license',
  'good_conduct_certificate',
  'marriage_certificate',
  'death_certificate'
);

-- Add document_type column to applicants table
ALTER TABLE applicants 
ADD COLUMN document_type document_type NOT NULL DEFAULT 'national_id';

-- Rename national_ids table to documents for clarity
ALTER TABLE national_ids RENAME TO documents;

-- Add document_type column to documents table
ALTER TABLE documents 
ADD COLUMN document_type document_type NOT NULL DEFAULT 'national_id';

-- Rename national_id_number to document_number for generalization
ALTER TABLE documents 
RENAME COLUMN national_id_number TO document_number;

-- Update RLS policies for documents table (rename from national_ids)
DROP POLICY IF EXISTS "Staff can upload national IDs" ON documents;
DROP POLICY IF EXISTS "Staff can view all national IDs" ON documents;

CREATE POLICY "Staff can upload documents"
  ON documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view all documents"
  ON documents FOR SELECT
  USING (true);