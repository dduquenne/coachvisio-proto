export default function LandingAvatar() {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 shadow-xl">
      <svg viewBox="0 0 160 160" className="h-36 w-36">
        <defs>
          <linearGradient id="skin" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#f2c6a8" />
            <stop offset="100%" stopColor="#d8a482" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="70" fill="#2f4466" />
        <circle cx="80" cy="70" r="45" fill="url(#skin)" />
        <path d="M50 132c10-18 50-18 60 0" fill="#f5f5f5" />
        <path d="M50 68c4-18 22-30 30-30s26 12 30 30" fill="#3b546f" />
        <circle cx="62" cy="72" r="6" fill="#1d2a3a" />
        <circle cx="98" cy="72" r="6" fill="#1d2a3a" />
        <path d="M68 94c6 6 18 6 24 0" stroke="#1d2a3a" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M64 112c8 6 24 6 32 0" stroke="#c9855f" strokeWidth="6" strokeLinecap="round" fill="none" />
      </svg>
      <div className="absolute -bottom-4 right-6 h-12 w-12 rounded-full bg-teal-400/90 shadow-lg shadow-teal-300/40" />
    </div>
  )
}
