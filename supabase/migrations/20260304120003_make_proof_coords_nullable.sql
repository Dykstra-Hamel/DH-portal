-- Allow proof feedback without coordinates (general comments)
ALTER TABLE proof_feedback ALTER COLUMN x_percent DROP NOT NULL;
ALTER TABLE proof_feedback ALTER COLUMN y_percent DROP NOT NULL;
