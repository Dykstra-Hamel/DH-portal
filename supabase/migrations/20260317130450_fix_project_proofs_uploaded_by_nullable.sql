-- Fix contradiction: uploaded_by was NOT NULL but the FK used ON DELETE SET NULL,
-- causing profile deletions to fail. Making the column nullable so the FK action works.
ALTER TABLE project_proofs
  ALTER COLUMN uploaded_by DROP NOT NULL;
