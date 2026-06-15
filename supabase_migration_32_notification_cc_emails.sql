-- Migration 32: Add CC email support for certification expiry notifications
-- School-level defaults + per-schedule overrides

-- School-level default CC emails for all notification schedules
ALTER TABLE schools
ADD COLUMN IF NOT EXISTS notification_cc_emails TEXT[] DEFAULT '{}';

-- Per-schedule CC email overrides (replaces school defaults when set)
ALTER TABLE certification_notification_schedules
ADD COLUMN IF NOT EXISTS cc_emails TEXT[] DEFAULT NULL;
