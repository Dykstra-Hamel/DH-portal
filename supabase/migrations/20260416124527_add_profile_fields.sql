-- Add user-editable profile fields: job title, customer-facing contact info, and uploaded avatar
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS title VARCHAR(150),
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS uploaded_avatar_url TEXT;

COMMENT ON COLUMN public.profiles.title IS 'User job title displayed on customer-facing surfaces (e.g. Lead Sales Inspector)';
COMMENT ON COLUMN public.profiles.phone IS 'Customer-facing phone number';
COMMENT ON COLUMN public.profiles.contact_email IS 'Customer-facing email, separate from auth login email';
COMMENT ON COLUMN public.profiles.uploaded_avatar_url IS 'User-uploaded profile photo URL stored in brand-assets bucket. Takes priority over OAuth avatar_url.';
