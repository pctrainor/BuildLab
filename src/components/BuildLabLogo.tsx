interface BuildLabLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export function BuildLabLogo({ size = 'md', showText = true, className = '' }: BuildLabLogoProps) {
  const sizes = {
    sm: { icon: 32, text: 'text-xl' },
    md: { icon: 40, text: 'text-2xl' },
    lg: { icon: 48, text: 'text-3xl' },
    xl: { icon: 64, text: 'text-4xl' }
  }

  const { icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 512 512" 
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4"/>
            <stop offset="100%" stopColor="#a855f7"/>
          </linearGradient>
        </defs>
        
        {/* Letter B (left side) */}
        <g fill="url(#logoGrad)">
          {/* Vertical bar of B */}
          <rect x="70" y="100" width="50" height="312" rx="8"/>
          
          {/* Top bump of B */}
          <rect x="120" y="100" width="90" height="46" rx="8"/>
          <rect x="180" y="100" width="46" height="110" rx="8"/>
          <rect x="120" y="164" width="90" height="46" rx="8"/>
          
          {/* Bottom bump of B (larger) */}
          <rect x="120" y="256" width="110" height="46" rx="8"/>
          <rect x="200" y="256" width="46" height="156" rx="8"/>
          <rect x="120" y="366" width="110" height="46" rx="8"/>
        </g>
        
        {/* Letter L (right side) */}
        <g fill="url(#logoGrad)">
          {/* Vertical bar of L */}
          <rect x="280" y="100" width="50" height="312" rx="8"/>
          
          {/* Horizontal bar of L */}
          <rect x="280" y="366" width="150" height="46" rx="8"/>
        </g>
        
        {/* Floating bubbles - matching favicon */}
        <circle cx="415" cy="130" r="28" fill="#06b6d4" opacity="0.9"/>
        <circle cx="430" cy="195" r="20" fill="#8b5cf6" opacity="0.85"/>
        <circle cx="405" cy="250" r="14" fill="#06b6d4" opacity="0.7"/>
        
        {/* Sparkle on top bubble */}
        <g fill="#ffffff">
          <rect x="406" y="126" width="18" height="4" rx="2"/>
          <rect x="413" y="119" width="4" height="18" rx="2"/>
        </g>
      </svg>

      {/* Text */}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-cyan-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent ${text}`}>
          BuildLab
        </span>
      )}
    </div>
  )
}
