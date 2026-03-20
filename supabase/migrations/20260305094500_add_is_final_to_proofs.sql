-- Add is_final flag to project_proofs
-- When a proof is marked final, feedback can no longer be added.
ALTER TABLE project_proofs ADD COLUMN is_final BOOLEAN NOT NULL DEFAULT FALSE;
