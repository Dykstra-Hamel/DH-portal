-- Update the handle_new_user function to properly parse names from OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    full_name TEXT;
    name_parts TEXT[];
    first_name_val TEXT;
    last_name_val TEXT;
BEGIN
    -- Get the full name from OAuth providers
    full_name := COALESCE(
        NEW.raw_user_meta_data->>'name',
        CONCAT(
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            ' ',
            COALESCE(NEW.raw_user_meta_data->>'last_name', '')
        )
    );
    
    -- Split the full name into first and last name
    IF full_name IS NOT NULL AND full_name != '' THEN
        name_parts := string_to_array(trim(full_name), ' ');
        first_name_val := COALESCE(name_parts[1], '');
        
        -- Join all remaining parts as last name
        IF array_length(name_parts, 1) > 1 THEN
            last_name_val := array_to_string(name_parts[2:], ' ');
        ELSE
            last_name_val := '';
        END IF;
    ELSE
        -- Fallback to individual fields if available
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    END IF;

    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        first_name_val,
        last_name_val
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add role column to profiles table for admin management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing profile for leftyjds@gmail.com to be admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'leftyjds@gmail.com';

-- Update the profile with proper name parsing for existing user
UPDATE profiles 
SET 
    first_name = CASE 
        WHEN (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = profiles.id) IS NOT NULL 
        THEN split_part(trim((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = profiles.id)), ' ', 1)
        ELSE first_name
    END,
    last_name = CASE 
        WHEN (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = profiles.id) IS NOT NULL 
        THEN trim(substring(trim((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = profiles.id)) from position(' ' in trim((SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = profiles.id))) + 1))
        ELSE last_name
    END
WHERE email = 'leftyjds@gmail.com' 
AND (first_name = '' OR first_name IS NULL OR last_name = '' OR last_name IS NULL);