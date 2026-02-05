import { requireRole, getEffectiveUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default async function PendingStatusPage() {
  try {
    await requireRole('assistant_coach');
    const supabase = await createClient();
    const effectiveUserId = await getEffectiveUserId();

    const { data: userData } = await supabase
      .from('users')
      .select(`
        approval_status,
        rejected_reason,
        first_name,
        last_name,
        school:school_id(name)
      `)
      .eq('id', effectiveUserId)
      .single();

    // If approved, redirect to main dashboard
    if (userData?.approval_status === 'approved') {
      redirect('/dashboard/assistant');
    }

    const school = Array.isArray(userData?.school) ? userData.school[0] : userData?.school;
    const isPending = userData?.approval_status === 'pending';
    const isRejected = userData?.approval_status === 'rejected';

    // Get certification count
    const { count: certCount } = await supabase
      .from('coach_certifications')
      .select('*', { count: 'exact', head: true })
      .eq('coach_id', effectiveUserId);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Card */}
        <div className={`bg-white rounded-xl shadow-card p-8 text-center ${isRejected ? 'border-2 border-red-200' : ''}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isPending ? 'bg-amber-50' : 'bg-red-50'
          }`}>
            {isPending ? (
              <ClockIcon className="w-10 h-10 text-amber-500" />
            ) : (
              <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
            )}
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isPending ? 'Approval Pending' : 'Application Not Approved'}
          </h1>

          {isPending ? (
            <p className="text-slate-600 mb-6">
              Your account is pending approval from {school?.name || 'your school'}.
              A school administrator will review your credentials and certifications.
            </p>
          ) : (
            <>
              <p className="text-slate-600 mb-4">
                Unfortunately, your application was not approved.
              </p>
              {userData?.rejected_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">Reason provided:</p>
                  <p className="text-sm text-red-700">{userData.rejected_reason}</p>
                </div>
              )}
              <p className="text-slate-500 text-sm">
                Please contact your school administrator for more information.
              </p>
            </>
          )}
        </div>

        {/* What to do next */}
        {isPending && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">While you wait</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DocumentCheckIcon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Upload Your Certifications</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Upload any required certifications to speed up the approval process.
                    School administrators will review these as part of your application.
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <a
                      href="/dashboard/assistant/certifications"
                      className="text-teal-600 hover:text-teal-700 text-sm font-medium"
                    >
                      View Certifications ({certCount || 0} uploaded)
                    </a>
                    <a
                      href="/dashboard/assistant/certifications/upload"
                      className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
                    >
                      Upload New
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 border border-slate-200 rounded-lg">
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Complete Your Profile</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Make sure your profile information is accurate and complete.
                    This helps administrators verify your identity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status timeline */}
        {isPending && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Approval Process</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Account Created</p>
                  <p className="text-sm text-slate-500">Your account has been set up</p>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-slate-200 h-6" />
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  (certCount || 0) > 0 ? 'bg-teal-500' : 'bg-slate-200'
                }`}>
                  {(certCount || 0) > 0 ? (
                    <CheckCircleIcon className="w-5 h-5 text-white" />
                  ) : (
                    <span className="text-slate-500 text-sm font-medium">2</span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900">Upload Certifications</p>
                  <p className="text-sm text-slate-500">
                    {(certCount || 0) > 0
                      ? `${certCount} certification(s) uploaded`
                      : 'Upload your credentials'
                    }
                  </p>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-slate-200 h-6" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <ClockIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Awaiting Review</p>
                  <p className="text-sm text-slate-500">School admin will review your application</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    redirect('/login');
  }
}
