import { SupabaseClient } from "@supabase/supabase-js";

// Types
export interface CertificationType {
  id: string;
  name: string;
  description: string | null;
  school_id: string | null;
  is_universal: boolean;
  validity_period_months: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramCertificationRequirement {
  id: string;
  program_id: string;
  certification_type_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  certification_type?: CertificationType;
}

export interface CoachCertification {
  id: string;
  coach_id: string;
  certification_type_id: string;
  certificate_number: string | null;
  issuing_organization: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  document_url: string | null;
  document_original_name: string | null;
  ocr_extracted_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  certification_type?: CertificationType;
}

export interface NotificationSchedule {
  id: string;
  school_id: string | null;
  days_before_expiry: number;
  notification_type: 'email' | 'in_app' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Certification status based on expiration date
export type CertificationStatus = 'valid' | 'expiring_soon' | 'expired' | 'no_expiration';

export function getCertificationStatus(
  expirationDate: string | null,
  daysWarning = 30
): CertificationStatus {
  if (!expirationDate) return 'no_expiration';

  const now = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiry < 0) return 'expired';
  if (daysUntilExpiry <= daysWarning) return 'expiring_soon';
  return 'valid';
}

export function getDaysUntilExpiry(expirationDate: string | null): number | null {
  if (!expirationDate) return null;
  const now = new Date();
  const expDate = new Date(expirationDate);
  return Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Get certification types available to a school (global + school-specific)
export async function getCertificationTypes(
  supabase: SupabaseClient,
  schoolId?: string | null
): Promise<CertificationType[]> {
  let query = supabase
    .from('certification_types')
    .select('*')
    .order('name');

  if (schoolId) {
    // Get global types (school_id is null) and school-specific types
    query = query.or(`school_id.is.null,school_id.eq.${schoolId}`);
  } else {
    // Get only global types
    query = query.is('school_id', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching certification types:', error);
    return [];
  }

  return data || [];
}

// Get coach's certifications with their types
export async function getCoachCertifications(
  supabase: SupabaseClient,
  coachId: string
): Promise<CoachCertification[]> {
  const { data, error } = await supabase
    .from('coach_certifications')
    .select(`
      *,
      certification_type:certification_types(*)
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coach certifications:', error);
    return [];
  }

  return data || [];
}

// Get program certification requirements
export async function getProgramCertificationRequirements(
  supabase: SupabaseClient,
  programId: string
): Promise<ProgramCertificationRequirement[]> {
  const { data, error } = await supabase
    .from('program_certification_requirements')
    .select(`
      *,
      certification_type:certification_types(*)
    `)
    .eq('program_id', programId)
    .order('is_required', { ascending: false });

  if (error) {
    console.error('Error fetching program requirements:', error);
    return [];
  }

  return data || [];
}

// Check coach compliance for a program
export interface ComplianceStatus {
  programId: string;
  programName: string;
  totalRequired: number;
  totalRecommended: number;
  completedRequired: number;
  completedRecommended: number;
  missingRequired: CertificationType[];
  missingRecommended: CertificationType[];
  expiringCerts: CoachCertification[];
  isCompliant: boolean;
}

export async function checkCoachCompliance(
  supabase: SupabaseClient,
  coachId: string,
  programId: string
): Promise<ComplianceStatus | null> {
  // Get program details
  const { data: program } = await supabase
    .from('summer_programs')
    .select('id, name')
    .eq('id', programId)
    .single();

  if (!program) return null;

  // Get program-specific requirements
  const requirements = await getProgramCertificationRequirements(supabase, programId);

  // Get universal certifications (these apply to ALL programs automatically)
  const { data: universalCerts } = await supabase
    .from('certification_types')
    .select('*')
    .eq('is_universal', true);

  // Get coach certifications
  const coachCerts = await getCoachCertifications(supabase, coachId);
  const coachCertTypeIds = new Set(coachCerts.map(c => c.certification_type_id));

  // Program-specific requirements
  const requiredReqs = requirements.filter(r => r.is_required);
  const recommendedReqs = requirements.filter(r => !r.is_required);

  // Missing from program-specific requirements
  const missingProgramRequired = requiredReqs
    .filter(r => !coachCertTypeIds.has(r.certification_type_id))
    .map(r => r.certification_type!)
    .filter(Boolean);

  // Missing universal certifications (always required)
  const missingUniversal = (universalCerts || [])
    .filter(cert => !coachCertTypeIds.has(cert.id))
    .map(cert => cert as CertificationType);

  // Combine missing required (avoid duplicates)
  const missingRequiredIds = new Set(missingProgramRequired.map(c => c.id));
  const missingRequired = [
    ...missingProgramRequired,
    ...missingUniversal.filter(c => !missingRequiredIds.has(c.id))
  ];

  const missingRecommended = recommendedReqs
    .filter(r => !coachCertTypeIds.has(r.certification_type_id))
    .map(r => r.certification_type!)
    .filter(Boolean);

  // Check for expiring certs (within 30 days)
  const expiringCerts = coachCerts.filter(c => {
    const status = getCertificationStatus(c.expiration_date);
    return status === 'expiring_soon' || status === 'expired';
  });

  const totalRequired = requiredReqs.length + (universalCerts?.length || 0);

  return {
    programId: program.id,
    programName: program.name,
    totalRequired,
    totalRecommended: recommendedReqs.length,
    completedRequired: totalRequired - missingRequired.length,
    completedRecommended: recommendedReqs.length - missingRecommended.length,
    missingRequired,
    missingRecommended,
    expiringCerts,
    isCompliant: missingRequired.length === 0 && expiringCerts.every(c => getCertificationStatus(c.expiration_date) !== 'expired'),
  };
}

// Get all compliance statuses for a coach's assigned programs
export async function getCoachComplianceStatus(
  supabase: SupabaseClient,
  coachId: string
): Promise<ComplianceStatus[]> {
  // Get programs the coach is assigned to
  const { data: assignments } = await supabase
    .from('program_coaches')
    .select('program_id')
    .eq('coach_id', coachId);

  if (!assignments || assignments.length === 0) return [];

  const statuses: ComplianceStatus[] = [];
  for (const assignment of assignments) {
    const status = await checkCoachCompliance(supabase, coachId, assignment.program_id);
    if (status) statuses.push(status);
  }

  return statuses;
}

// Get expiring certifications for notification purposes
export async function getExpiringCertifications(
  supabase: SupabaseClient,
  daysBeforeExpiry: number,
  schoolId?: string | null
): Promise<(CoachCertification & { coach_email: string; coach_name: string })[]> {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBeforeExpiry);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  // Get tomorrow's date for range
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + daysBeforeExpiry - 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  let query = supabase
    .from('coach_certifications')
    .select(`
      *,
      certification_type:certification_types(*),
      coach:users!coach_certifications_coach_id_fkey(id, email, first_name, last_name, school_id)
    `)
    .gte('expiration_date', tomorrowStr)
    .lte('expiration_date', targetDateStr);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching expiring certifications:', error);
    return [];
  }

  // Filter by school if specified
  let results = data || [];
  if (schoolId) {
    results = results.filter((cert: { coach?: { school_id?: string } }) =>
      cert.coach?.school_id === schoolId
    );
  }

  return results.map((cert: {
    coach?: {
      email?: string;
      first_name?: string;
      last_name?: string
    };
    [key: string]: unknown;
  }) => ({
    ...cert,
    coach_email: cert.coach?.email || '',
    coach_name: `${cert.coach?.first_name || ''} ${cert.coach?.last_name || ''}`.trim() || 'Coach',
  })) as (CoachCertification & { coach_email: string; coach_name: string })[];
}

// Format certification status for display
export function formatCertificationStatus(status: CertificationStatus): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (status) {
    case 'valid':
      return { label: 'Valid', color: 'text-green-700', bgColor: 'bg-green-100' };
    case 'expiring_soon':
      return { label: 'Expiring Soon', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    case 'expired':
      return { label: 'Expired', color: 'text-red-700', bgColor: 'bg-red-100' };
    case 'no_expiration':
      return { label: 'No Expiration', color: 'text-gray-700', bgColor: 'bg-gray-100' };
  }
}
