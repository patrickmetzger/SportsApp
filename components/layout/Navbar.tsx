'use client';

import { useState } from 'react';

interface NavbarProps {
  title: string;
  userEmail?: string;
  role?: string;
}

export default function Navbar({ title, userEmail, role }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-800">{title}</h1>
            {role && (
              <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {role}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="hidden sm:block text-sm text-gray-600">{userEmail}</span>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <form action="/api/auth/logout" method="POST" className="hidden sm:block">
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                Logout
              </button>
            </form>
          </div>
        </div>

        {isMenuOpen && (
          <div className="sm:hidden pb-4">
            {userEmail && (
              <div className="text-sm text-gray-600 mb-2">{userEmail}</div>
            )}
            <form action="/api/auth/logout" method="POST">
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                Logout
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  );
}
