'use client';

import { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Coach {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  programs: { id: string; name: string; studentName: string }[];
}

interface Message {
  id: string;
  subject: string;
  message: string;
  recipient_ids: string[];
  status: string;
  created_at: string;
}

interface ParentCommunicationsClientProps {
  coaches: Coach[];
  sentMessages: Message[];
}

export default function ParentCommunicationsClient({
  coaches,
  sentMessages,
}: ParentCommunicationsClientProps) {
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoach || !subject.trim() || !message.trim()) return;

    setSending(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/parent/communications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_id: selectedCoach.id,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setSubject('');
      setMessage('');
      setSelectedCoach(null);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coaches List */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Coaches</h2>

          {coaches.length === 0 ? (
            <div className="text-center py-8">
              <UserCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No coaches found</p>
              <p className="text-slate-400 text-xs mt-1">
                Register for a program to connect with coaches
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coaches.map((coach) => (
                <button
                  key={coach.id}
                  onClick={() => setSelectedCoach(coach)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedCoach?.id === coach.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-700 font-semibold text-sm">
                        {coach.first_name?.[0]}{coach.last_name?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">
                        {coach.first_name} {coach.last_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {coach.programs.map(p => p.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Form */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Send Message</h2>

          {success && (
            <div className="mb-4 p-4 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-3">
              <CheckCircleIcon className="w-5 h-5 text-teal-600" />
              <p className="text-sm text-teal-800">Message sent successfully!</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button onClick={() => setError('')}>
                <XMarkIcon className="w-5 h-5 text-red-500" />
              </button>
            </div>
          )}

          {selectedCoach ? (
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">To:</p>
                <p className="font-medium text-slate-900">
                  {selectedCoach.first_name} {selectedCoach.last_name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Coach for: {selectedCoach.programs.map(p => `${p.name} (${p.studentName})`).join(', ')}
                </p>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  placeholder="Type your message here..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCoach(null)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="px-6 py-2 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    'Sending...'
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">Select a coach to send a message</p>
            </div>
          )}
        </div>

        {/* Recent Messages */}
        {sentMessages.length > 0 && (
          <div className="bg-white rounded-xl shadow-card p-6 mt-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Messages</h2>
            <div className="space-y-3">
              {sentMessages.slice(0, 5).map((msg) => (
                <div key={msg.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">{msg.subject}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      msg.status === 'sent'
                        ? 'bg-teal-100 text-teal-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{msg.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(msg.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
