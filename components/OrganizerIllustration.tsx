export function OrganizerIllustration() {
  return (
    <div className="shrink-0 w-48 h-48 md:w-56 md:h-56 relative">
      <svg
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="card1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5dff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c759ff" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="card2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4de1ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#7c5dff" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#7c5dff" />
            <stop offset="100%" stopColor="#c759ff" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#4de1ff" />
            <stop offset="100%" stopColor="#7c5dff" />
          </linearGradient>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5dff" />
            <stop offset="50%" stopColor="#c759ff" />
            <stop offset="100%" stopColor="#4de1ff" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background glow orbs */}
        <circle cx="140" cy="140" r="120" fill="#7c5dff" opacity="0.04" />
        <circle cx="100" cy="110" r="60" fill="#c759ff" opacity="0.06" />
        <circle cx="190" cy="170" r="50" fill="#4de1ff" opacity="0.05" />

        {/* Main dashboard card (back) */}
        <g transform="translate(30, 20)" opacity="0.7">
          <rect
            x="0" y="0" width="160" height="100"
            rx="12"
            fill="url(#card2)"
            stroke="#4de1ff" strokeOpacity="0.2" strokeWidth="1"
          />
          {/* Mini bar chart */}
          <rect x="16" y="60" width="10" height="24" rx="2" fill="url(#barGrad2)" opacity="0.8" />
          <rect x="32" y="48" width="10" height="36" rx="2" fill="url(#barGrad2)" opacity="0.9" />
          <rect x="48" y="54" width="10" height="30" rx="2" fill="url(#barGrad2)" opacity="0.7" />
          <rect x="64" y="38" width="10" height="46" rx="2" fill="url(#barGrad2)" />
          <rect x="80" y="44" width="10" height="40" rx="2" fill="url(#barGrad2)" opacity="0.85" />
          {/* Label lines */}
          <rect x="16" y="16" width="60" height="4" rx="2" fill="white" opacity="0.15" />
          <rect x="16" y="26" width="40" height="3" rx="1.5" fill="white" opacity="0.08" />
          {/* Sparkline */}
          <polyline
            points="110,70 120,55 130,60 140,40 148,45"
            stroke="#4de1ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            fill="none" opacity="0.6"
          />
          <circle cx="148" cy="45" r="3" fill="#4de1ff" opacity="0.8" />
        </g>

        {/* Main dashboard card (front) */}
        <g transform="translate(70, 80)">
          <rect
            x="0" y="0" width="180" height="120"
            rx="14"
            fill="url(#card1)"
            stroke="#7c5dff" strokeOpacity="0.3" strokeWidth="1"
          />
          {/* Header line */}
          <rect x="18" y="16" width="70" height="5" rx="2.5" fill="white" opacity="0.2" />
          <rect x="18" y="27" width="45" height="3" rx="1.5" fill="white" opacity="0.1" />
          {/* Status dot */}
          <circle cx="155" cy="20" r="5" fill="#4de1ff" opacity="0.6" filter="url(#glow)" />

          {/* Bar chart */}
          <rect x="18" y="72" width="12" height="30" rx="3" fill="url(#barGrad)" opacity="0.9" />
          <rect x="36" y="58" width="12" height="44" rx="3" fill="url(#barGrad)" />
          <rect x="54" y="66" width="12" height="36" rx="3" fill="url(#barGrad)" opacity="0.8" />
          <rect x="72" y="50" width="12" height="52" rx="3" fill="url(#barGrad)" />
          <rect x="90" y="62" width="12" height="40" rx="3" fill="url(#barGrad)" opacity="0.85" />
          <rect x="108" y="56" width="12" height="46" rx="3" fill="url(#barGrad)" opacity="0.95" />

          {/* Trend line overlay */}
          <polyline
            points="24,68 42,52 60,60 78,44 96,54 114,48"
            stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            fill="none" opacity="0.3"
          />

          {/* Right side: donut chart hint */}
          <circle cx="148" cy="72" r="22" stroke="url(#ringGrad)" strokeWidth="5" fill="none" opacity="0.5" strokeDasharray="80 60" />
          <circle cx="148" cy="72" r="22" stroke="#4de1ff" strokeWidth="5" fill="none" opacity="0.3" strokeDasharray="30 110" strokeDashoffset="-80" />
        </g>

        {/* Floating avatar circles */}
        <g filter="url(#glow)">
          <circle cx="58" cy="170" r="14" fill="#1a1040" stroke="#7c5dff" strokeWidth="1.5" opacity="0.8" />
          <circle cx="58" cy="170" r="7" fill="#7c5dff" opacity="0.4" />
        </g>
        <g filter="url(#glow)">
          <circle cx="40" cy="200" r="11" fill="#1a1040" stroke="#c759ff" strokeWidth="1.5" opacity="0.7" />
          <circle cx="40" cy="200" r="5.5" fill="#c759ff" opacity="0.4" />
        </g>
        <g filter="url(#glow)">
          <circle cx="72" cy="215" r="9" fill="#1a1040" stroke="#4de1ff" strokeWidth="1.5" opacity="0.6" />
          <circle cx="72" cy="215" r="4.5" fill="#4de1ff" opacity="0.4" />
        </g>

        {/* Floating event card (small) */}
        <g transform="translate(195, 40)" opacity="0.6">
          <rect x="0" y="0" width="65" height="40" rx="8" fill="url(#card1)" stroke="#c759ff" strokeOpacity="0.2" strokeWidth="1" />
          <rect x="10" y="10" width="30" height="3" rx="1.5" fill="white" opacity="0.2" />
          <rect x="10" y="18" width="20" height="2" rx="1" fill="white" opacity="0.1" />
          <circle cx="50" cy="26" r="6" fill="#c759ff" opacity="0.3" />
        </g>

        {/* Connection lines */}
        <line x1="58" y1="156" x2="85" y2="130" stroke="#7c5dff" strokeWidth="0.5" opacity="0.3" />
        <line x1="40" y1="189" x2="75" y2="165" stroke="#c759ff" strokeWidth="0.5" opacity="0.2" />
        <line x1="227" y1="80" x2="245" y2="100" stroke="#c759ff" strokeWidth="0.5" opacity="0.2" />

        {/* Decorative dots */}
        <circle cx="260" cy="110" r="2" fill="#4de1ff" opacity="0.4" />
        <circle cx="245" cy="130" r="1.5" fill="#7c5dff" opacity="0.3" />
        <circle cx="25" cy="145" r="1.5" fill="#c759ff" opacity="0.3" />
        <circle cx="15" cy="230" r="2" fill="#4de1ff" opacity="0.2" />

        {/* Glowing accent spark */}
        <g transform="translate(235, 95)" filter="url(#softGlow)">
          <path
            d="M0 8 L3 0 L6 8 L3 6 Z"
            fill="#4de1ff" opacity="0.6"
          />
        </g>
        <g transform="translate(20, 120)" filter="url(#softGlow)">
          <path
            d="M0 6 L2.5 0 L5 6 L2.5 4.5 Z"
            fill="#c759ff" opacity="0.4"
          />
        </g>
      </svg>
    </div>
  );
}
