-- Add profile fields to admins table
-- This migration adds fields for admin profile information

-- Add name fields
ALTER TABLE admins ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add position and access level
ALTER TABLE admins ADD COLUMN IF NOT EXISTS position TEXT; -- Position in the academy
ALTER TABLE admins ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'standard'; -- standard, elevated, full

-- Add contact information
ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS city TEXT;

-- Add notes/description
ALTER TABLE admins ADD COLUMN IF NOT EXISTS notes TEXT; -- Additional notes about the admin

-- Add created_by to track who created this admin account
ALTER TABLE admins ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES admins(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_admins_access_level ON admins(access_level);
CREATE INDEX IF NOT EXISTS idx_admins_position ON admins(position);
CREATE INDEX IF NOT EXISTS idx_admins_created_by ON admins(created_by);

-- Comments for documentation
COMMENT ON COLUMN admins.first_name IS 'Admin first name';
COMMENT ON COLUMN admins.last_name IS 'Admin last name';
COMMENT ON COLUMN admins.position IS 'Position in the academy (e.g., Director, Instructor, Coordinator)';
COMMENT ON COLUMN admins.access_level IS 'Level of access: standard (basic), elevated (moderate), full (all permissions)';
COMMENT ON COLUMN admins.phone IS 'Admin phone number';
COMMENT ON COLUMN admins.created_by IS 'ID of the admin who created this account';

