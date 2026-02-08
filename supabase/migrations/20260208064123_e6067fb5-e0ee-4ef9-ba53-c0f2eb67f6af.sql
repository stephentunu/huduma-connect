-- Drop the old unique constraint on document_number
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS national_ids_national_id_number_key;

-- Add a composite unique constraint: one document per type per applicant
ALTER TABLE public.documents ADD CONSTRAINT documents_applicant_document_type_key UNIQUE (applicant_id, document_type);