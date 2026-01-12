'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { generateColorPalette } from '@/lib/colorPalette';

interface School {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface SchoolSettingsFormProps {
  school: School;
}

export default function SchoolSettingsForm({ school }: SchoolSettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(school.name);
  const [address, setAddress] = useState(school.address || '');
  const [city, setCity] = useState(school.city || '');
  const [state, setState] = useState(school.state || '');
  const [zip_code, setZip] = useState(school.zip_code || '');
  const [phone, setPhone] = useState(school.phone || '');
  const [email, setEmail] = useState(school.email || '');
  const [website, setWebsite] = useState(school.website || '');
  const [logoUrl, setLogoUrl] = useState(school.logo_url || '');
  const [primaryColor, setPrimaryColor] = useState(school.primary_color || '#1e40af');
  const [secondaryColor, setSecondaryColor] = useState(school.secondary_color || '#3b82f6');

  // Generate color palette preview
  const colorPalette = useMemo(() => {
    return generateColorPalette(primaryColor, secondaryColor);
  }, [primaryColor, secondaryColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/school-admin/school/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: school.id,
          name,
          address,
          city,
          state,
          zip_code,
          phone,
          email,
          website,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update school');
      }

      setSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          School information updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="CA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={zip_code}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Branding</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                School Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="https://example.com/logo.png"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a URL to your school logo image (PNG, JPG, or SVG)
              </p>
              {logoUrl && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Logo Preview:</p>
                  <img
                    src={logoUrl}
                    alt="School logo preview"
                    className="max-h-24 max-w-xs object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="#1e40af"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Main brand color for headers and buttons
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                    placeholder="#3b82f6"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Accent color for links and highlights
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-5">
              <div className="flex gap-3 items-start mb-4">
                <div className="text-blue-600 text-lg">🎨</div>
                <div>
                  <h3 className="font-semibold text-blue-900">Generated Color Palette</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your complete palette with automatic variations for buttons, hovers, and accents
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Primary Palette */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Primary Palette</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.primary.lighter }} />
                      <span className="text-xs text-gray-600">Lighter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.primary.light }} />
                      <span className="text-xs text-gray-600">Light</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.primary.base }} />
                      <span className="text-xs font-semibold text-gray-900">Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.primary.dark }} />
                      <span className="text-xs text-gray-600">Dark (hover)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.primary.darker }} />
                      <span className="text-xs text-gray-600">Darker (active)</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Palette */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Secondary Palette</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.secondary.lighter }} />
                      <span className="text-xs text-gray-600">Lighter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.secondary.light }} />
                      <span className="text-xs text-gray-600">Light</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.secondary.base }} />
                      <span className="text-xs font-semibold text-gray-900">Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.secondary.dark }} />
                      <span className="text-xs text-gray-600">Dark (hover)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.secondary.darker }} />
                      <span className="text-xs text-gray-600">Darker (active)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accent and Neutral */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-blue-200">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Accent Colors</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.accent.base }} />
                      <span className="text-xs text-gray-600">Complementary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.accent.light }} />
                      <span className="text-xs text-gray-600">Light</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Neutral Surfaces</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.neutral[50] }} />
                      <span className="text-xs text-gray-600">50</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.neutral[100] }} />
                      <span className="text-xs text-gray-600">100</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: colorPalette.neutral[200] }} />
                      <span className="text-xs text-gray-600">200</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Preview */}
              <div className="mt-4 pt-4 border-t border-blue-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Interactive Preview</p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-4 py-2 rounded text-white font-semibold transition-all hover:shadow-lg"
                    style={{ backgroundColor: colorPalette.primary.base }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorPalette.primary.dark}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorPalette.primary.base}
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded text-white font-semibold transition-all hover:shadow-lg"
                    style={{ backgroundColor: colorPalette.secondary.base }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colorPalette.secondary.dark}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colorPalette.secondary.base}
                  >
                    Secondary Button
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded font-semibold border-2 transition-all"
                    style={{
                      borderColor: colorPalette.primary.base,
                      color: colorPalette.primary.base
                    }}
                  >
                    Outline Button
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 school-btn-primary py-3 rounded-lg disabled:bg-gray-400 transition font-semibold"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <a
            href="/school-admin"
            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition text-center font-semibold flex items-center justify-center"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
