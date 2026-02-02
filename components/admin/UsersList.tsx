'use client';

interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  archived: boolean;
  school?: School;
}

interface UsersListProps {
  users: User[] | null;
}

export default function UsersList({ users }: UsersListProps) {
  const handleArchive = (e: React.FormEvent) => {
    if (!confirm('Are you sure you want to archive this user?')) {
      e.preventDefault();
    }
  };

  const getUserStatus = (user: User) => {
    if (user.archived) {
      return 'archived';
    }
    // Check if user has completed account setup (has first and last name)
    if (!user.first_name || !user.last_name || user.first_name.trim() === '' || user.last_name.trim() === '') {
      return 'pending';
    }
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              School
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users?.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {user.first_name} {user.last_name}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  user.role === 'school_admin' ? 'bg-indigo-100 text-indigo-800' :
                  user.role === 'coach' ? 'bg-blue-100 text-blue-800' :
                  user.role === 'assistant_coach' ? 'bg-cyan-100 text-cyan-800' :
                  user.role === 'student' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {user.role === 'assistant_coach' ? 'assistant coach' : user.role === 'school_admin' ? 'school admin' : user.role}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(getUserStatus(user))}`}>
                  {getUserStatus(user)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {user.school ? (
                    <>
                      {user.school.name}
                      {user.school.city && user.school.state && (
                        <div className="text-xs text-gray-500">
                          {user.school.city}, {user.school.state}
                        </div>
                      )}
                    </>
                  ) : (
                    (user.role === 'coach' || user.role === 'assistant_coach') ? (
                      <span className="text-gray-400 italic">No school assigned</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <form action="/api/admin/impersonate" method="POST" className="inline">
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Impersonate
                  </button>
                </form>
                <a href={`/admin/users/${user.id}/edit`} className="text-gray-600 hover:text-gray-900 mr-4">
                  Edit
                </a>
                <form action="/api/admin/archive-user" method="POST" className="inline" onSubmit={handleArchive}>
                  <input type="hidden" name="userId" value={user.id} />
                  <button
                    type="submit"
                    className="text-orange-600 hover:text-orange-900"
                  >
                    Archive
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!users || users.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-500">
          No users found
        </div>
      )}
    </div>
  );
}
