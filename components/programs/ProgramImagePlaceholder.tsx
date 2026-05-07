export default function ProgramImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-navy-900 flex items-center justify-center ${className}`}>
      {/* Field lines */}
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer boundary */}
        <rect x="20" y="15" width="360" height="195" rx="4" fill="none" stroke="white" strokeWidth="2" />
        {/* Center line */}
        <line x1="200" y1="15" x2="200" y2="210" stroke="white" strokeWidth="2" />
        {/* Center circle */}
        <circle cx="200" cy="112" r="36" fill="none" stroke="white" strokeWidth="2" />
        {/* Center dot */}
        <circle cx="200" cy="112" r="3" fill="white" />
        {/* Left penalty box */}
        <rect x="20" y="65" width="72" height="95" fill="none" stroke="white" strokeWidth="2" />
        {/* Right penalty box */}
        <rect x="308" y="65" width="72" height="95" fill="none" stroke="white" strokeWidth="2" />
        {/* Left goal box */}
        <rect x="20" y="88" width="30" height="48" fill="none" stroke="white" strokeWidth="2" />
        {/* Right goal box */}
        <rect x="350" y="88" width="30" height="48" fill="none" stroke="white" strokeWidth="2" />
        {/* Corner arcs */}
        <path d="M 20 30 Q 35 15 50 15" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M 350 15 Q 375 15 380 30" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M 20 195 Q 20 210 35 210" fill="none" stroke="white" strokeWidth="1.5" />
        <path d="M 365 210 Q 380 210 380 195" fill="none" stroke="white" strokeWidth="1.5" />
      </svg>
      {/* Trophy icon */}
      <svg
        className="relative w-12 h-12 text-white opacity-60"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    </div>
  );
}
