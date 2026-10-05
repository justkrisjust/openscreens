import React from 'react';
import type { BotGesture } from '../../services/storage';

export type BotEmoteType = 'normal' | 'frustrated' | 'sweat' | 'lightbulb' | 'coffee' | 'stars' | 'steam' | 'question';

interface BotFaceProps {
  status: BotGesture;
  emote?: BotEmoteType;
  color?: string;
  size?: number; // default 48
  isWalking?: boolean;
}

export const BotFace: React.FC<BotFaceProps> = ({
  status,
  emote = 'normal',
  color = '#10b981',
  size = 48,
  isWalking = false,
}) => {
  // Determine effective emotion from status if emote is normal
  let activeEmote: BotEmoteType = emote;
  if (activeEmote === 'normal') {
    if (status === 'blocked') activeEmote = 'frustrated';
    else if (status === 'needs_help') activeEmote = 'sweat';
    else if (status === 'thinking') activeEmote = 'question';
    else if (status === 'done') activeEmote = 'stars';
    else if (status === 'waiting') activeEmote = 'coffee';
    else if (status === 'working') activeEmote = 'lightbulb';
  }

  // Floating emote icon badge
  const emoteBadges: Record<BotEmoteType, { icon: string; bg: string; anim: string }> = {
    normal: { icon: '•ᴗ•', bg: 'bg-emerald-500/20 text-emerald-400', anim: '' },
    frustrated: { icon: '💢 😤', bg: 'bg-rose-500/20 text-rose-400', anim: 'animate-frustrated' },
    sweat: { icon: '💦 (｡•́︿•̀｡)', bg: 'bg-amber-500/20 text-amber-400', anim: 'animate-bounce' },
    lightbulb: { icon: '💡 ⚡', bg: 'bg-emerald-500/20 text-emerald-300', anim: 'animate-pulse' },
    coffee: { icon: '☕ ˘ ³˘', bg: 'bg-slate-800 text-slate-300', anim: '' },
    stars: { icon: '★ ᵔᴥᵔ ★', bg: 'bg-emerald-500/20 text-emerald-300', anim: 'animate-bounce' },
    steam: { icon: '♨️ (>_<)', bg: 'bg-rose-500/20 text-rose-400', anim: 'animate-frustrated' },
    question: { icon: '❓ 💭', bg: 'bg-amber-500/20 text-amber-300', anim: 'animate-pulse' },
  };

  const badge = emoteBadges[activeEmote];

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${
        isWalking ? 'transition-all duration-500' : ''
      }`}
      style={{ width: size, height: size }}
    >
      {/* Floating Emote Bubble above head */}
      <div
        className={`absolute -top-7 px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-700/80 shadow-md backdrop-blur-sm z-10 whitespace-nowrap ${
          badge.bg
        } ${badge.anim}`}
      >
        {badge.icon}
      </div>

      {/* Bot Robot Screen / Head */}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={`filter drop-shadow-md transition-transform duration-300 ${
          status === 'working' ? 'scale-105' : ''
        }`}
      >
        {/* Antenna */}
        <line x1="32" y1="4" x2="32" y2="12" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <circle
          cx="32"
          cy="4"
          r="3.5"
          fill={status === 'working' ? '#10b981' : status === 'blocked' ? '#f43f5e' : '#f59e0b'}
          className={status === 'working' ? 'animate-ping' : ''}
        />

        {/* Outer Head Chassis */}
        <rect
          x="8"
          y="12"
          width="48"
          height="42"
          rx="12"
          fill="#181a20"
          stroke={status === 'working' ? '#10b981' : '#2e313c'}
          strokeWidth="2.5"
        />

        {/* Ear bolts */}
        <rect x="4" y="26" width="4" height="14" rx="2" fill="#323542" />
        <rect x="56" y="26" width="4" height="14" rx="2" fill="#323542" />

        {/* Inner Glowing Screen Face */}
        <rect
          x="13"
          y="17"
          width="38"
          height="32"
          rx="8"
          fill="#0c0d10"
          stroke={color}
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* Cheek Blush */}
        <circle cx="18" cy="38" r="2.5" fill="#f43f5e" opacity="0.35" />
        <circle cx="46" cy="38" r="2.5" fill="#f43f5e" opacity="0.35" />

        {/* Animated Eyes based on emotion */}
        {activeEmote === 'frustrated' || activeEmote === 'steam' ? (
          /* Frustrated gritted squint eyes (> <) */
          <g stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
            <line x1="20" y1="26" x2="26" y2="30" />
            <line x1="20" y1="34" x2="26" y2="30" />

            <line x1="44" y1="26" x2="38" y2="30" />
            <line x1="44" y1="34" x2="38" y2="30" />
          </g>
        ) : activeEmote === 'sweat' ? (
          /* Stressed / troubled eyes with sweat drop */
          <g>
            <circle cx="23" cy="29" r="3" fill="#f59e0b" />
            <circle cx="41" cy="29" r="3" fill="#f59e0b" />
            <path d="M48 20 C48 18 51 17 51 20 C51 22 48 22 48 20" fill="#38bdf8" />
          </g>
        ) : activeEmote === 'stars' ? (
          /* Triumphant star eyes (★ ★) */
          <g fill="#10b981">
            <polygon points="23,24 24,28 28,29 24,31 23,35 21,31 18,29 21,28" />
            <polygon points="41,24 42,28 46,29 42,31 41,35 39,31 36,29 39,28" />
          </g>
        ) : activeEmote === 'question' ? (
          /* Puzzled thinking eyes (one eyebrow raised) */
          <g fill="#f59e0b">
            <circle cx="23" cy="27" r="3.5" />
            <circle cx="41" cy="31" r="2.5" />
            <line x1="19" y1="22" x2="27" y2="24" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : activeEmote === 'coffee' ? (
          /* Relaxed happy sleeping curves */
          <g stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M 20 29 Q 23 25 26 29" />
            <path d="M 38 29 Q 41 25 44 29" />
          </g>
        ) : (
          /* Normal / Focused working eyes */
          <g fill={color}>
            <circle cx="23" cy="28" r="3.5" />
            <circle cx="41" cy="28" r="3.5" />
            {/* Sparkle highlights */}
            <circle cx="24.5" cy="26.5" r="1.2" fill="#ffffff" />
            <circle cx="42.5" cy="26.5" r="1.2" fill="#ffffff" />
          </g>
        )}

        {/* Animated Mouth based on emotion */}
        {activeEmote === 'frustrated' || activeEmote === 'steam' ? (
          /* Wavy gritted teeth line */
          <path
            d="M 25 41 Q 28 39 32 41 Q 36 43 39 41"
            stroke="#f43f5e"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : activeEmote === 'sweat' ? (
          /* Troubled small inverted curve */
          <path
            d="M 27 42 Q 32 38 37 42"
            stroke="#f59e0b"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        ) : activeEmote === 'stars' ? (
          /* Big happy open mouth */
          <path
            d="M 26 38 Q 32 46 38 38 Z"
            fill="#10b981"
          />
        ) : (
          /* Cheerful smile */
          <path
            d="M 26 39 Q 32 44 38 39"
            stroke={color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
