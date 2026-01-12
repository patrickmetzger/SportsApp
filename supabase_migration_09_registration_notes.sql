-- Migration 9: Add Notes Column to Program Registrations

-- Add notes column to program_registrations table
ALTER TABLE program_registrations
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add comment for documentation
COMMENT ON COLUMN program_registrations.notes IS 'Additional notes about the registration (scholarships, sponsors, special circumstances, etc.)';
COMMENT ON COLUMN program_registrations.updated_at IS 'Timestamp of last update to the registration';

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_program_registrations_updated_at ON program_registrations;

CREATE TRIGGER update_program_registrations_updated_at
    BEFORE UPDATE ON program_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
