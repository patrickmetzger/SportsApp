'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/types';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            role: role,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Use window.location for full page reload to ensure session is picked up
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold-400 to-gold-600"></div>
        <div className="max-w-md space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-extralight tracking-tighter leading-tight">
              Begin Your<br />Journey
            </h1>
            <div className="w-16 h-0.5 bg-gold-500"></div>
          </div>
          <p className="text-lg font-light text-gray-400 leading-relaxed">
            Join the premier platform for athletic excellence and program management.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-12">
          {/* Logo/Brand */}
          <div className="text-center lg:text-left space-y-3">
            <h2 className="text-4xl font-light tracking-tight text-black">
              Create account
            </h2>
            <p className="text-gray-500 font-light">Start your journey with us</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="border-l-2 border-red-600 bg-red-50 p-4 text-sm text-red-900 font-light">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-8">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="firstName" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors font-light text-lg"
                  placeholder="John"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="lastName" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors font-light text-lg"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-3">
              <label htmlFor="email" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors font-light text-lg"
                placeholder="you@example.com"
              />
            </div>

            {/* Password input */}
            <div className="space-y-3">
              <label htmlFor="password" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:border-black transition-colors font-light text-lg"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* Role selector */}
            <div className="space-y-3">
              <label htmlFor="role" className="block text-xs uppercase tracking-wider text-gray-500 font-medium">
                I Am A
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-0 py-3 bg-transparent border-0 border-b-2 border-gray-200 text-black focus:outline-none focus:border-black transition-colors font-light text-lg"
              >
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="coach">Coach</option>
              </select>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 font-light text-sm uppercase tracking-widest hover:bg-gray-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-300 relative group overflow-hidden"
            >
              <span className="relative z-10">
                {loading ? 'Creating Account...' : 'Create Account'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gold-600 to-gold-500 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-8 border-t border-gray-100">
            <p className="text-sm text-gray-500 font-light">
              Already have an account?{' '}
              <a href="/login" className="text-black hover:text-gold-600 transition-colors font-normal">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
