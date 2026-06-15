'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Schedule {
  id: string;
  school_id: string | null;
  days_before_expiry: number;
  notification_type: 'email' | 'in_app' | 'both';
  is_active: boolean;
  cc_emails: string[] | null;
  created_at: string;
}

interface NotificationScheduleConfigProps {
  isSchoolAdmin?: boolean;
}

export default function NotificationScheduleConfig({ isSchoolAdmin = false }: NotificationScheduleConfigProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [newSchedule, setNewSchedule] = useState({
    days_before_expiry: 30,
    notification_type: 'both' as 'email' | 'in_app' | 'both',
    cc_emails_input: '',
  });

  // School-level default CC emails
  const [schoolCcEmails, setSchoolCcEmails] = useState<string[]>([]);
  const [schoolCcInput, setSchoolCcInput] = useState('');
  const [savingSchoolCc, setSavingSchoolCc] = useState(false);
  const [schoolCcMessage, setSchoolCcMessage] = useState('');

  useEffect(() => {
    fetchSchedules();
    if (isSchoolAdmin) {
      fetchSchoolCcEmails();
    }
  }, []);

  const fetchSchoolCcEmails = async () => {
    try {
      const res = await fetch('/api/school-admin/school');
      if (res.ok) {
        const data = await res.json();
        setSchoolCcEmails(data.school?.notification_cc_emails || []);
      }
    } catch (error) {
      console.error('Error fetching school CC emails:', error);
    }
  };

  const handleSaveSchoolCc = async () => {
    setSavingSchoolCc(true);
    setSchoolCcMessage('');
    try {
      const res = await fetch('/api/school-admin/school/cc-emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_cc_emails: schoolCcEmails }),
      });
      if (res.ok) {
        setSchoolCcMessage('Saved successfully');
      } else {
        const data = await res.json();
        setSchoolCcMessage(`Error: ${data.error}`);
      }
    } catch {
      setSchoolCcMessage('Error: Failed to save');
    } finally {
      setSavingSchoolCc(false);
    }
  };

  const addSchoolCcEmail = () => {
    const email = schoolCcInput.trim().toLowerCase();
    if (email && email.includes('@') && !schoolCcEmails.includes(email)) {
      setSchoolCcEmails([...schoolCcEmails, email]);
      setSchoolCcInput('');
    }
  };

  const removeSchoolCcEmail = (email: string) => {
    setSchoolCcEmails(schoolCcEmails.filter((e) => e !== email));
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const endpoint = isSchoolAdmin
        ? '/api/school-admin/notification-schedules'
        : '/api/admin/notification-schedules';

      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const endpoint = isSchoolAdmin
        ? '/api/school-admin/notification-schedules'
        : '/api/admin/notification-schedules';

      const ccEmails = newSchedule.cc_emails_input
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e && e.includes('@'));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days_before_expiry: newSchedule.days_before_expiry,
          notification_type: newSchedule.notification_type,
          cc_emails: ccEmails.length > 0 ? ccEmails : null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowForm(false);
        setNewSchedule({ days_before_expiry: 30, notification_type: 'both', cc_emails_input: '' });
        fetchSchedules();
      } else {
        setError(data.error || 'Failed to create schedule');
      }
    } catch (err) {
      setError('Failed to create schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (schedule: Schedule) => {
    try {
      const endpoint = isSchoolAdmin
        ? `/api/school-admin/notification-schedules/${schedule.id}`
        : `/api/admin/notification-schedules/${schedule.id}`;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !schedule.is_active }),
      });

      if (res.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification schedule?')) {
      return;
    }

    try {
      const endpoint = isSchoolAdmin
        ? `/api/school-admin/notification-schedules/${id}`
        : `/api/admin/notification-schedules/${id}`;

      const res = await fetch(endpoint, { method: 'DELETE' });

      if (res.ok) {
        fetchSchedules();
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const canModify = (schedule: Schedule) => {
    if (!isSchoolAdmin) return true;
    return schedule.school_id !== null; // School admins can only modify their own
  };

  const formatDays = (days: number) => {
    if (days === 0) return 'On expiration day';
    if (days === 1) return '1 day before';
    return `${days} days before`;
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'email': return 'Email only';
      case 'in_app': return 'In-app only';
      case 'both': return 'Email & In-app';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* School-level default CC emails */}
      {isSchoolAdmin && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Default Notification Recipients</h3>
          <p className="text-xs text-gray-500 mb-3">
            These emails will receive all certification expiry notifications for your school, unless a schedule specifies its own recipients.
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {schoolCcEmails.map((email) => (
              <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700">
                {email}
                <button
                  type="button"
                  onClick={() => removeSchoolCcEmail(email)}
                  className="text-gray-400 hover:text-red-500 ml-0.5"
                >
                  &times;
                </button>
              </span>
            ))}
            {schoolCcEmails.length === 0 && (
              <span className="text-sm text-gray-400">No default recipients set</span>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              value={schoolCcInput}
              onChange={(e) => setSchoolCcInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSchoolCcEmail(); } }}
              placeholder="email@example.com"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={addSchoolCcEmail}
              className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Add
            </button>
            <button
              type="button"
              onClick={handleSaveSchoolCc}
              disabled={savingSchoolCc}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {savingSchoolCc ? 'Saving...' : 'Save'}
            </button>
          </div>

          {schoolCcMessage && (
            <p className={`text-xs mt-2 ${schoolCcMessage.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {schoolCcMessage}
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Notification Schedules</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure when to send certification expiry reminders to coaches
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Add Schedule
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Before Expiry
                </label>
                <input
                  type="number"
                  min="0"
                  max="365"
                  value={newSchedule.days_before_expiry}
                  onChange={(e) => setNewSchedule({ ...newSchedule, days_before_expiry: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Type
                </label>
                <select
                  value={newSchedule.notification_type}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notification_type: e.target.value as 'email' | 'in_app' | 'both' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="both">Email & In-app</option>
                  <option value="email">Email only</option>
                  <option value="in_app">In-app only</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CC Emails <span className="font-normal text-gray-400">(optional, comma-separated)</span>
              </label>
              <input
                type="text"
                value={newSchedule.cc_emails_input}
                onChange={(e) => setNewSchedule({ ...newSchedule, cc_emails_input: e.target.value })}
                placeholder="ad@school.edu, principal@school.edu"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                {isSchoolAdmin
                  ? 'Overrides school default recipients for this schedule. Leave blank to use defaults.'
                  : 'Additional recipients for this schedule.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Schedule'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notification schedules configured yet
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`flex items-center justify-between p-4 bg-white rounded-lg border ${
                schedule.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${schedule.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <div className="font-medium text-gray-900">
                    {formatDays(schedule.days_before_expiry)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatType(schedule.notification_type)}
                    {schedule.school_id === null && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                        Global
                      </span>
                    )}
                  </div>
                  {schedule.cc_emails && schedule.cc_emails.length > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      CC: {schedule.cc_emails.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {canModify(schedule) ? (
                  <>
                    <button
                      onClick={() => handleToggleActive(schedule)}
                      className={`px-3 py-1 rounded text-sm ${
                        schedule.is_active
                          ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {schedule.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-gray-400">Read only</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
