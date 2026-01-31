-- Migration 16: Coach Certification Management System

-- ============================================
-- Table: certification_types
-- Master list of certification types (global or school-specific)
-- ============================================
CREATE TABLE IF NOT EXISTS certification_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL = global type
  is_universal BOOLEAN DEFAULT FALSE, -- Applies to all sports/programs if true
  validity_period_months INTEGER DEFAULT 12, -- Default expiration period
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for certification_types
CREATE INDEX idx_certification_types_school_id ON certification_types(school_id);
CREATE INDEX idx_certification_types_is_universal ON certification_types(is_universal);

-- Enable RLS
ALTER TABLE certification_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_types
CREATE POLICY "Admins can manage all certification types" ON certification_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "School admins can view global and their school's certification types" ON certification_types
  FOR SELECT USING (
    school_id IS NULL -- Global types visible to all
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND u.school_id = certification_types.school_id
    )
  );

CREATE POLICY "School admins can manage their school's certification types" ON certification_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND u.school_id = certification_types.school_id
    )
  );

CREATE POLICY "Coaches can view certification types" ON certification_types
  FOR SELECT USING (
    school_id IS NULL -- Global types
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'coach'
        AND u.school_id = certification_types.school_id
    )
  );

-- ============================================
-- Table: program_certification_requirements
-- Links certification types to programs (required vs recommended)
-- ============================================
CREATE TABLE IF NOT EXISTS program_certification_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES summer_programs(id) ON DELETE CASCADE,
  certification_type_id UUID NOT NULL REFERENCES certification_types(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE, -- Required vs recommended
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, certification_type_id) -- Prevent duplicate requirements
);

-- Indexes for program_certification_requirements
CREATE INDEX idx_program_cert_reqs_program_id ON program_certification_requirements(program_id);
CREATE INDEX idx_program_cert_reqs_cert_type_id ON program_certification_requirements(certification_type_id);

-- Enable RLS
ALTER TABLE program_certification_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for program_certification_requirements
CREATE POLICY "Admins can manage all program certification requirements" ON program_certification_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "School admins can manage their school's program requirements" ON program_certification_requirements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN summer_programs sp ON sp.school_id = u.school_id
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND sp.id = program_certification_requirements.program_id
    )
  );

CREATE POLICY "Coaches can view program certification requirements" ON program_certification_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM program_coaches pc
      WHERE pc.coach_id = auth.uid()
        AND pc.program_id = program_certification_requirements.program_id
    )
  );

-- ============================================
-- Table: coach_certifications
-- Coach uploaded certifications
-- ============================================
CREATE TABLE IF NOT EXISTS coach_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certification_type_id UUID NOT NULL REFERENCES certification_types(id) ON DELETE CASCADE,
  certificate_number TEXT,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  document_url TEXT, -- URL to uploaded document in storage
  document_original_name TEXT, -- Original filename for display
  ocr_extracted_data JSONB DEFAULT '{}'::jsonb, -- OCR results for audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for coach_certifications
CREATE INDEX idx_coach_certifications_coach_id ON coach_certifications(coach_id);
CREATE INDEX idx_coach_certifications_cert_type_id ON coach_certifications(certification_type_id);
CREATE INDEX idx_coach_certifications_expiration_date ON coach_certifications(expiration_date);

-- Enable RLS
ALTER TABLE coach_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_certifications
CREATE POLICY "Admins can manage all coach certifications" ON coach_certifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "School admins can view certifications for coaches in their school" ON coach_certifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      JOIN users coach_user ON coach_user.id = coach_certifications.coach_id
      WHERE admin_user.id = auth.uid()
        AND admin_user.role = 'school_admin'
        AND admin_user.school_id = coach_user.school_id
    )
  );

CREATE POLICY "Coaches can manage their own certifications" ON coach_certifications
  FOR ALL USING (
    coach_id = auth.uid()
  );

-- ============================================
-- Table: certification_notification_schedules
-- Configurable notification timing (e.g., 90, 30, 14 days before expiry)
-- ============================================
CREATE TABLE IF NOT EXISTS certification_notification_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE, -- NULL = global default
  days_before_expiry INTEGER NOT NULL, -- e.g., 90, 30, 14
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'in_app', 'both')) DEFAULT 'both',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, days_before_expiry) -- Prevent duplicate schedules per school
);

-- Indexes for certification_notification_schedules
CREATE INDEX idx_cert_notif_schedules_school_id ON certification_notification_schedules(school_id);
CREATE INDEX idx_cert_notif_schedules_days ON certification_notification_schedules(days_before_expiry);

-- Enable RLS
ALTER TABLE certification_notification_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_notification_schedules
CREATE POLICY "Admins can manage all notification schedules" ON certification_notification_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "School admins can manage their school's notification schedules" ON certification_notification_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.role = 'school_admin'
        AND u.school_id = certification_notification_schedules.school_id
    )
  );

-- Insert default global notification schedules
INSERT INTO certification_notification_schedules (school_id, days_before_expiry, notification_type)
VALUES
  (NULL, 90, 'both'),
  (NULL, 30, 'both'),
  (NULL, 14, 'email'),
  (NULL, 7, 'both')
ON CONFLICT DO NOTHING;

-- ============================================
-- Table: certification_notification_logs
-- Prevents duplicate notifications
-- ============================================
CREATE TABLE IF NOT EXISTS certification_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_certification_id UUID NOT NULL REFERENCES coach_certifications(id) ON DELETE CASCADE,
  notification_schedule_id UUID NOT NULL REFERENCES certification_notification_schedules(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'in_app')),
  UNIQUE(coach_certification_id, notification_schedule_id, notification_type) -- Prevent duplicates
);

-- Indexes for certification_notification_logs
CREATE INDEX idx_cert_notif_logs_cert_id ON certification_notification_logs(coach_certification_id);
CREATE INDEX idx_cert_notif_logs_schedule_id ON certification_notification_logs(notification_schedule_id);
CREATE INDEX idx_cert_notif_logs_sent_at ON certification_notification_logs(sent_at);

-- Enable RLS
ALTER TABLE certification_notification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for certification_notification_logs
CREATE POLICY "Admins can manage all notification logs" ON certification_notification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "School admins can view notification logs for their school" ON certification_notification_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      JOIN coach_certifications cc ON cc.id = certification_notification_logs.coach_certification_id
      JOIN users coach_user ON coach_user.id = cc.coach_id
      WHERE admin_user.id = auth.uid()
        AND admin_user.role = 'school_admin'
        AND admin_user.school_id = coach_user.school_id
    )
  );

-- ============================================
-- Trigger functions for updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_certification_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_program_cert_reqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_coach_certifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_cert_notif_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_certification_types_timestamp
  BEFORE UPDATE ON certification_types
  FOR EACH ROW
  EXECUTE FUNCTION update_certification_types_updated_at();

CREATE TRIGGER update_program_cert_reqs_timestamp
  BEFORE UPDATE ON program_certification_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_program_cert_reqs_updated_at();

CREATE TRIGGER update_coach_certifications_timestamp
  BEFORE UPDATE ON coach_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_certifications_updated_at();

CREATE TRIGGER update_cert_notif_schedules_timestamp
  BEFORE UPDATE ON certification_notification_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_cert_notif_schedules_updated_at();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE certification_types IS 'Master list of certification types that can be required for programs';
COMMENT ON COLUMN certification_types.school_id IS 'NULL for global types visible to all schools, otherwise school-specific';
COMMENT ON COLUMN certification_types.is_universal IS 'If true, applies to all programs regardless of sport';
COMMENT ON COLUMN certification_types.validity_period_months IS 'Default validity period for this certification type';

COMMENT ON TABLE program_certification_requirements IS 'Links certification types to programs with required/recommended status';
COMMENT ON COLUMN program_certification_requirements.is_required IS 'True if certification is required, false if recommended';

COMMENT ON TABLE coach_certifications IS 'Certifications uploaded by coaches with document storage and OCR data';
COMMENT ON COLUMN coach_certifications.document_url IS 'URL to the uploaded certification document in storage';
COMMENT ON COLUMN coach_certifications.ocr_extracted_data IS 'JSON containing OCR extracted data for audit purposes';

COMMENT ON TABLE certification_notification_schedules IS 'Configurable notification timing for certification expiry alerts';
COMMENT ON COLUMN certification_notification_schedules.days_before_expiry IS 'Number of days before expiration to send notification';
COMMENT ON COLUMN certification_notification_schedules.notification_type IS 'Type of notification: email, in_app, or both';

COMMENT ON TABLE certification_notification_logs IS 'Tracks sent notifications to prevent duplicates';
