import React from 'react';

interface ImperioLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
}

export default function ImperioLogo({ className = '', size = 'md', variant = 'full' }: ImperioLogoProps) {
  // Dimensions based on size prop
  const dimensions = {
    sm: variant === 'full' ? 'h-10' : 'h-8 w-8',
    md: variant === 'full' ? 'h-20' : 'h-14 w-14',
    lg: variant === 'full' ? 'h-28' : 'h-20 w-20',
    xl: variant === 'full' ? 'h-40' : 'h-32 w-32',
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${dimensions} ${className}`} id="imperio-main-logo">
      <svg
        viewBox="0 0 500 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_15px_rgba(255,110,0,0.15)]"
      >
        <defs>
          {/* Main Gold/Orange Gradients for Crown */}
          <linearGradient id="crownGoldLeft" x1="150" y1="60" x2="250" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="30%" stopColor="#FFA600" />
            <stop offset="100%" stopColor="#D95100" />
          </linearGradient>
          
          <linearGradient id="crownGoldRight" x1="250" y1="60" x2="350" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFC74D" />
            <stop offset="50%" stopColor="#E06C00" />
            <stop offset="100%" stopColor="#9E2200" />
          </linearGradient>

          <linearGradient id="crownGoldCenter" x1="250" y1="50" x2="250" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFEAA3" />
            <stop offset="40%" stopColor="#FF9C00" />
            <stop offset="100%" stopColor="#C43B00" />
          </linearGradient>

          {/* Chrome/Metallic silver Gradient for Text */}
          <linearGradient id="metallicChrome" x1="0" y1="180" x2="500" y2="320" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Base stroke metal gradient */}
          <linearGradient id="baseMetal" x1="200" y1="160" x2="300" y2="185" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Subtle drop shadow/glow */}
          <filter id="royalGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- CROWN GRAPHIC --- */}
        <g id="crown-graphic">
          {/* 1. CENTRAL SPIRE (Perfect Faceted 3D Diamond Spearhead) */}
          {/* Left half of center spire */}
          <path
            d="M 250 50 L 225 152 L 250 178 Z"
            fill="url(#crownGoldCenter)"
            opacity="0.95"
          />
          {/* Right half of center spire */}
          <path
            d="M 250 50 L 275 152 L 250 178 Z"
            fill="url(#crownGoldRight)"
          />
          {/* Highlight facet */}
          <path
            d="M 250 50 L 250 178 L 261 140 Z"
            fill="#FFF5CC"
            opacity="0.3"
          />

          {/* 2. LEFT SPIRE (Angled outward, custom hook-cutout on inside) */}
          {/* Outer edge of left point */}
          <path
            d="M 172 82 L 195 161 C 195 161 175 161 161 171 L 211 180 L 221 165 L 188 139 L 210 120 L 172 82 Z"
            fill="url(#crownGoldLeft)"
          />
          {/* Highlight and facet lines on left spire */}
          <path
            d="M 172 82 L 188 139 L 211 180 L 195 161 Z"
            fill="#FFEFA3"
            opacity="0.25"
          />

          {/* 3. RIGHT SPIRE (Mirror of left spire, pointing right) */}
          {/* Outer edge of right point */}
          <path
            d="M 328 82 L 305 161 C 305 161 325 161 339 171 L 289 180 L 279 165 L 312 139 L 290 120 L 328 82 Z"
            fill="url(#crownGoldRight)"
          />
          {/* Shadow facet on right spire */}
          <path
            d="M 328 82 L 312 139 L 289 180 L 305 161 Z"
            fill="#6E1E00"
            opacity="0.2"
          />

          {/* 4. BASE OF THE CROWN (Curved, arched parallel plates) */}
          {/* Upper arch */}
          <path
            d="M 197 185 Q 250 169 303 185 L 297 197 Q 250 182 203 197 Z"
            fill="url(#crownGoldCenter)"
          />
          {/* Lower arch / base plate */}
          <path
            d="M 200 203 Q 250 193 300 203 L 294 214 Q 250 204 206 214 Z"
            fill="url(#crownGoldRight)"
          />
        </g>

        {/* --- TYPOGRAPHY: IMPÉRIO --- */}
        {variant === 'full' && (
          <g id="typography-branding">
            {/* Elegant luxury metallic reflection text */}
            <text
              x="250"
              y="280"
              fontFamily="Outfit, system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="64"
              textAnchor="middle"
              fill="url(#metallicChrome)"
              letterSpacing="7"
              stroke="#111111"
              strokeWidth="2"
            >
              IMPÉRIO
            </text>

            {/* Custom sharp, stylized accent on the E */}
            <path
              d="M 268 215 L 284 205 L 278 211 Z"
              fill="url(#crownGoldCenter)"
              stroke="#111111"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
