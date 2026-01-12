import { isImpersonating, getImpersonatedUserId } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function ImpersonationBanner() {
  const impersonating = await isImpersonating();

  if (!impersonating) {
    return null;
  }

  const impersonatedUserId = await getImpersonatedUserId();
  const supabase = await createClient();

  // Get the impersonated user's details
  const { data: impersonatedUser } = await supabase
    .from('users')
    .select('email, first_name, last_name, role')
    .eq('id', impersonatedUserId!)
    .single();

  return (
    <div className="bg-yellow-500 text-black px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span className="font-semibold">
            Admin Mode: Impersonating {impersonatedUser?.first_name} {impersonatedUser?.last_name}
          </span>
          <span className="text-sm">
            ({impersonatedUser?.email} - {impersonatedUser?.role})
          </span>
        </div>
        <form action="/api/admin/stop-impersonate" method="POST">
          <button
            type="submit"
            className="bg-black text-yellow-500 px-4 py-2 rounded font-semibold hover:bg-gray-800 transition"
          >
            Stop Impersonating
          </button>
        </form>
      </div>
    </div>
  );
}
