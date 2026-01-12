'use client';

import { useState, useEffect } from 'react';

interface ContactCoachFormProps {
  programId: string;
  programName: string;
  coachEmail: string;
  coachName: string;
  onClose: () => void;
}

export default function ContactCoachForm({
  programId,
  programName,
  coachEmail,
  coachName,
}: ContactCoachFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [childId, setChildId] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [registeredChildren, setRegisteredChildren] = useState<any[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(true);

  // Fetch user's registered children for this program
  useEffect(() => {
    const fetchRegisteredChildren = async () => {
      try {
        const response = await fetch(`/api/programs/${programId}/registered-children`);
        if (response.ok) {
          const data = await response.json();
          setRegisteredChildren(data.children || []);
          // Auto-select if only one child
          if (data.children && data.children.length === 1) {
            setChildId(data.children[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch registered children:', err);
      } finally {
        setLoadingChildren(false);
      }
    };

    fetchRegisteredChildren();
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/programs/contact-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          programName,
          coachEmail,
          coachName,
          senderName: name,
          senderEmail: email,
          childId,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <svg
          className="w-12 h-12 text-green-600 mx-auto mb-3"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Message Sent!
        </h3>
        <p className="text-green-700 mb-4">
          Your message has been sent to {coachName}. They will respond to your email address.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Program
        </label>
        <input
          type="text"
          value={programName}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Email *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="you@example.com"
        />
      </div>

      {loadingChildren ? (
        <div className="text-sm text-gray-600">Loading registered children...</div>
      ) : registeredChildren.length > 0 ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regarding Child *
          </label>
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a child</option>
            {registeredChildren.map((child) => (
              <option key={child.id} value={child.id}>
                {child.student_name} ({child.student_id})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            No registered children found for this program. This message will be sent as a general inquiry.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message / Question *
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Your question or comment..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-semibold"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
