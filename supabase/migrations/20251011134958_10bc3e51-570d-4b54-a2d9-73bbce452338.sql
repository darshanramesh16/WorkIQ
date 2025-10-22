-- Add manager role to enum
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;