import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export default async function EligibleStudentsPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole('admin');
    const { id } = await params;
    const supabase = await createClient();

    // Fetch program with eligibility criteria
    const { data: program, error: programError } = await supabase
      .from('summer_programs')
      .select('*')
      .eq('id', id)
      .single();

    if (programError || !program) {
      redirect('/admin/programs');
    }

    // Fetch all children from parent_children table
    const { data: allChildren } = await supabase
      .from('parent_children')
      .select(`
        *,
        parent:parent_user_id (
          first_name,
          last_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Filter children based on eligibility criteria
    const eligibleChildren = (allChildren || []).filter((child) => {
      // Check grade eligibility
      if (child.grade !== null) {
        if (program.min_grade && child.grade < program.min_grade) return false;
        if (program.max_grade && child.grade > program.max_grade) return false;
      }

      // Check age eligibility
      if (child.date_of_birth) {
        const age = calculateAge(child.date_of_birth);
        if (program.min_age && age < program.min_age) return false;
        if (program.max_age && age > program.max_age) return false;
      }

      // Check gender eligibility
      if (program.gender_restriction && program.gender_restriction !== 'any') {
        if (child.gender && child.gender !== program.gender_restriction) {
          return false;
        }
      }

      return true;
    });

    // Fetch existing registrations for this program
    const { data: registrations } = await supabase
      .from('program_registrations')
      .select('student_id')
      .eq('program_id', id);

    const registeredStudentIds = new Set(
      registrations?.map((r) => r.student_id) || []
    );

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/admin/programs" className="text-blue-600 hover:text-blue-800">
                ← Back to Programs
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {program.name} - Eligible Students
            </h1>
            <p className="text-gray-600">
              Students who meet the eligibility criteria for this program
            </p>
          </div>

          {/* Eligibility Criteria Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Eligibility Criteria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-900">Grade Range:</span>{' '}
                <span className="text-blue-700">
                  {program.min_grade || 'No min'} - {program.max_grade || 'No max'}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-900">Age Range:</span>{' '}
                <span className="text-blue-700">
                  {program.min_age || 'No min'} - {program.max_age || 'No max'} years
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-900">Gender:</span>{' '}
                <span className="text-blue-700 capitalize">
                  {program.gender_restriction || 'Any'}
                </span>
              </div>
              {program.eligibility_notes && (
                <div className="md:col-span-2 lg:col-span-3">
                  <span className="font-medium text-blue-900">Additional Notes:</span>{' '}
                  <span className="text-blue-700">{program.eligibility_notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Eligible Students</h3>
              <p className="text-3xl font-bold text-green-900">{eligibleChildren.length}</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Already Registered</h3>
              <p className="text-3xl font-bold text-gray-900">{registeredStudentIds.size}</p>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {eligibleChildren.length > 0 ? (
                  eligibleChildren.map((child: any) => {
                    const isRegistered = child.student_id && registeredStudentIds.has(child.student_id);
                    const age = child.date_of_birth ? calculateAge(child.date_of_birth) : null;

                    return (
                      <tr key={child.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {child.first_name} {child.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{child.student_id || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {child.grade ? `Grade ${child.grade}` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {age !== null ? `${age} years` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 capitalize">
                            {child.gender || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {child.parent?.first_name} {child.parent?.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{child.parent?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isRegistered ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Registered
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Not Registered
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No eligible students found based on the current criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
