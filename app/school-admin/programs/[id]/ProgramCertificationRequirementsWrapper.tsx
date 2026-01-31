'use client';

import ProgramCertificationRequirements from '@/components/admin/ProgramCertificationRequirements';

interface Props {
  programId: string;
  schoolId: string;
}

export default function ProgramCertificationRequirementsWrapper({ programId, schoolId }: Props) {
  return (
    <ProgramCertificationRequirements
      programId={programId}
      isSchoolAdmin={true}
      schoolId={schoolId}
    />
  );
}
