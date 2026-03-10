-- Rename is_final to is_approved on project_proofs
ALTER TABLE project_proofs RENAME COLUMN is_final TO is_approved;
