'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface School {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  school?: School;
}

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  school?: School;
}

interface SendCommunicationFormProps {
  currentUserRole: string;
  currentUserSchoolId?: string;
}

export default function SendCommunicationForm({ currentUserRole, currentUserSchoolId }: SendCommunicationFormProps) {
  const [recipientType, setRecipientType] = useState<'individual' | 'school_coaches' | 'school_parents' | 'all_coaches'>('individual');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState(currentUserSchoolId || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'sms' | 'both'>('email');
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch coaches
        const coachesResponse = await fetch('/api/admin/coaches');
        if (coachesResponse.ok) {
          const coachesData = await coachesResponse.json();
          setCoaches(coachesData.coaches || []);
        }

        // Fetch parents
        const parentsResponse = await fetch('/api/admin/parents');
        if (parentsResponse.ok) {
          const parentsData = await parentsResponse.json();
          setParents(parentsData.parents || []);
        }

        // Fetch schools (only if admin, school_admins are locked to their school)
        if (currentUserRole === 'admin') {
          const schoolsResponse = await fetch('/api/admin/schools');
          if (schoolsResponse.ok) {
            const schoolsData = await schoolsResponse.json();
            setSchools(schoolsData.schools || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, [currentUserRole]);

  // Filter coaches and parents based on school
  const getFilteredCoaches = () => {
    let filtered = coaches;

    if (currentUserRole === 'school_admin') {
      filtered = filtered.filter((c) => c.school?.id === currentUserSchoolId);
    } else if (recipientType === 'school_coaches' && selectedSchoolId) {
      filtered = filtered.filter((c) => c.school?.id === selectedSchoolId);
    }

    return filtered;
  };

  const getFilteredParents = () => {
    let filtered = parents;

    if (currentUserRole === 'school_admin') {
      filtered = filtered.filter((p) => p.school?.id === currentUserSchoolId);
    } else if (recipientType === 'school_parents' && selectedSchoolId) {
      filtered = filtered.filter((p) => p.school?.id === selectedSchoolId);
    }

    return filtered;
  };

  const filteredCoaches = getFilteredCoaches();
  const filteredParents = getFilteredParents();

  // Combined list for individual selection (coaches and parents)
  const allRecipients = [
    ...filteredCoaches.map((c) => ({ ...c, type: 'coach' as const })),
    ...filteredParents.map((p) => ({ ...p, type: 'parent' as const })),
  ].sort((a, b) => a.last_name.localeCompare(b.last_name));

  const handleRecipientTypeChange = (type: 'individual' | 'school_coaches' | 'school_parents' | 'all_coaches') => {
    setRecipientType(type);
    setSelectedRecipientIds([]);
    if (type === 'all_coaches') {
      setSelectedSchoolId('');
    }
  };

  const handleRecipientSelect = (recipientId: string) => {
    if (selectedRecipientIds.includes(recipientId)) {
      setSelectedRecipientIds(selectedRecipientIds.filter((id) => id !== recipientId));
    } else {
      setSelectedRecipientIds([...selectedRecipientIds, recipientId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRecipientIds.length === allRecipients.length) {
      setSelectedRecipientIds([]);
    } else {
      setSelectedRecipientIds(allRecipients.map((r) => r.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Determine recipient IDs based on type
      let recipientIds: string[] = [];



      if (recipientType === 'individual') {
        recipientIds = selectedRecipientIds;
      } else if (recipientType === 'school_coaches') {
        recipientIds = filteredCoaches.map((c) => c.id);
      } else if (recipientType === 'school_parents') {
        recipientIds = filteredParents.map((p) => p.id);
      } else if (recipientType === 'all_coaches') {
        recipientIds = coaches.map((c) => c.id);
      }

      if (recipientIds.length === 0) {
        throw new Error('Please select at least one recipient');
      }

      // Determine school_id to send
      let schoolIdToSend = null;
      if (recipientType === 'school_coaches' || recipientType === 'school_parents') {
        schoolIdToSend = currentUserRole === 'school_admin' ? currentUserSchoolId : selectedSchoolId;
      }

      const response = await fetch('/api/admin/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_ids: recipientIds,
          recipient_type: recipientType,
          school_id: schoolIdToSend,
          subject,
          message,
          delivery_method: deliveryMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send communication');
      }

      setSuccess(true);
      setTimeout(() => {
        if (currentUserRole === 'school_admin') {
          router.push('/school-admin/communications');
        } else {
          router.push('/admin/communications');
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <div className="text-green-600 text-4xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Communication Sent!</h2>
        <p className="text-gray-600">Your message has been queued for delivery.</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to communications history...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Send Communication</h2>
        <p className="text-gray-600 mt-2">
          Send email or SMS messages to coaches and parents
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="individual"
                checked={recipientType === 'individual'}
                onChange={(e) => handleRecipientTypeChange(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-gray-900">Individual Coaches and Parents</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="school_coaches"
                checked={recipientType === 'school_coaches'}
                onChange={(e) => handleRecipientTypeChange(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-gray-900">All Coaches at {currentUserRole === 'school_admin' ? 'My School' : 'a School'}</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="school_parents"
                checked={recipientType === 'school_parents'}
                onChange={(e) => handleRecipientTypeChange(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-gray-900">All Parents at {currentUserRole === 'school_admin' ? 'My School' : 'a School'}</span>
            </label>
            {currentUserRole === 'admin' && (
              <label className="flex items-center">
                <input
                  type="radio"
                  value="all_coaches"
                  checked={recipientType === 'all_coaches'}
                  onChange={(e) => handleRecipientTypeChange(e.target.value as any)}
                  className="mr-2"
                />
                <span className="text-gray-900">All Coaches (System-wide)</span>
              </label>
            )}
          </div>
        </div>

        {/* School Selection (for school_coaches or school_parents type) */}
        {(recipientType === 'school_coaches' || recipientType === 'school_parents') && currentUserRole === 'admin' && (
          <div>
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
              Select School *
            </label>
            <select
              id="school"
              value={selectedSchoolId}
              onChange={(e) => {
                setSelectedSchoolId(e.target.value);
                setSelectedRecipientIds([]);
              }}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a school...</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} {school.city && school.state ? `(${school.city}, ${school.state})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Individual Recipient Selection */}
        {recipientType === 'individual' && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Recipients * ({selectedRecipientIds.length} selected)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedRecipientIds.length === allRecipients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              {allRecipients.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No recipients available
                </div>
              ) : (
                <div className="divide-y">
                  {allRecipients.map((recipient) => (
                    <label key={recipient.id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRecipientIds.includes(recipient.id)}
                        onChange={() => handleRecipientSelect(recipient.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">
                            {recipient.first_name} {recipient.last_name}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            recipient.type === 'coach'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {recipient.type === 'coach' ? 'Coach' : 'Parent'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">{recipient.email}</div>
                        {recipient.school && (
                          <div className="text-xs text-gray-400">
                            {recipient.school.name}
                          </div>
                        )}
                      </div>
                      {recipient.phone && (
                        <div className="text-xs text-gray-500">{recipient.phone}</div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview recipients for bulk types */}
        {(recipientType === 'school_coaches' || recipientType === 'school_parents' || recipientType === 'all_coaches') && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-900 mb-1">
              This message will be sent to:
            </div>
            <div className="text-sm text-blue-700">
              {recipientType === 'all_coaches' && `All ${coaches.length} coaches in the system`}
              {recipientType === 'school_coaches' && currentUserRole === 'school_admin' && (
                `All ${filteredCoaches.length} coaches at your school`
              )}
              {recipientType === 'school_coaches' && currentUserRole === 'admin' && selectedSchoolId && (
                <>
                  All {filteredCoaches.length} coaches at {schools.find((s) => s.id === selectedSchoolId)?.name}
                </>
              )}
              {recipientType === 'school_coaches' && currentUserRole === 'admin' && !selectedSchoolId && 'Select a school to see recipient count'}
              {recipientType === 'school_parents' && currentUserRole === 'school_admin' && (
                `All ${filteredParents.length} parents at your school`
              )}
              {recipientType === 'school_parents' && currentUserRole === 'admin' && selectedSchoolId && (
                <>
                  All {filteredParents.length} parents at {schools.find((s) => s.id === selectedSchoolId)?.name}
                </>
              )}
              {recipientType === 'school_parents' && currentUserRole === 'admin' && !selectedSchoolId && 'Select a school to see recipient count'}
            </div>
          </div>
        )}

        {/* Delivery Method */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Method *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                value="email"
                checked={deliveryMethod === 'email'}
                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-gray-900">Email Only</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="sms"
                checked={deliveryMethod === 'sms'}
                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-gray-900">SMS Only (requires phone numbers)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="both"
                checked={deliveryMethod === 'both'}
                onChange={(e) => setDeliveryMethod(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-gray-900">Both Email and SMS</span>
            </label>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject *
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter message subject..."
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message *
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your message..."
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length} characters
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-2 rounded-lg disabled:bg-gray-400 transition ${
              currentUserRole === 'school_admin'
                ? 'school-btn-primary'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send Communication'}
          </button>
          <a
            href={currentUserRole === 'school_admin' ? '/school-admin/communications' : '/admin/communications'}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition text-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
