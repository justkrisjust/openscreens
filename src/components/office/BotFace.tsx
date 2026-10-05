import React from 'react';
import type { BotGesture, BotShape } from '../../services/storage';

export type BotEmoteType = 'normal' | 'frustrated' | 'sweat' | 'lightbulb' | 'coffee' | 'stars' | 'steam' | 'question';

export interface BotFaceProps {
  status?: BotGesture;
  emote?: BotEmoteType;
  shape?: BotShape;
  color?: string;
  size?: number; // default 48
  isWalking?: boolean;
  showEmoteBadge?: boolean;
  className?: string;
}

export const BOT_SHAPES: { id: BotShape; label: string; symbol: string }[] = [
  { id: 'circle', label: 'Circle', symbol: '●' },
  { id: 'squircle', label: 'Squircle', symbol: '■' },
  { id: 'box', label: 'Sharp Box', symbol: '■' },
  { id: 'star', label: 'Star', symbol: '★' },
  { id: 'hexagon', label: 'Hexagon', symbol: '⬡' },
  { id: 'diamond', label: 'Diamond', symbol: '◆' },
  { id: 'shield', label: 'Shield', symbol: '🛡' },
  { id: 'capsule', label: 'Capsule', symbol: '💊' },
  { id: 'heart', label: 'Heart', symbol: '♥' },
  { id: 'octagon', label: 'Octagon', symbol: '🛑' },
];

export const BotFace: React.FC<BotFaceProps> = ({
  status = 'waiting',
  emote = 'normal',
  shape = 'squircle',
  color = '#10b981',
  size = 48,
  isWalking = false,
  showEmoteBadge = true,
  className = '',
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

  // Render SVG chassis path/geometry based on the 10 selected shapes
  const renderShapeChassis = () => {
    const strokeCol = status === 'working' ? color : status === 'blocked' ? '#f43f5e' : color;
    const chassisFill = '#131418';

    switch (shape) {
      case 'circle':
        return (
          <>
            <circle cx="32" cy="34" r="23" fill={chassisFill} stroke={strokeCol} strokeWidth="2.5" />
            <circle cx="32" cy="34" r="18" fill="#090a0d" stroke={strokeCol} strokeWidth="1" strokeOpacity="0.5" />
          </>
        );

      case 'box':
        return (
          <>
            <rect x="10" y="12" width="44" height="44" rx="4" fill={chassisFill} stroke={strokeCol} strokeWidth="2.5" />
            <rect x="15" y="17" width="34" height="34" rx="2" fill="#090a0d" stroke={strokeCol} strokeWidth="1" strokeOpacity="0.5" />
          </>
        );

      case 'star':
        return (
          <>
            <polygon
              points="32,6 39,22 56,22 42,34 47,52 32,41 17,52 22,34 8,22 25,22"
              fill={chassisFill}
              stroke={strokeCol}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="33" r="15" fill="#090a0d" stroke={strokeCol} strokeWidth="1" strokeOpacity="0.6" />
          </>
        );

      case 'hexagon':
        return (
          <>
            <polygon
              points="32,8 55,21 55,47 32,60 9,47 9,21"
              fill={chassisFill}
              stroke={strokeCol}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="32,15 48,25 48,43 32,53 16,43 16,25"
              fill="#090a0d"
              stroke={strokeCol}
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </>
        );

      case 'diamond':
        return (
          <>
            <polygon
              points="32,6 58,34 32,62 6,34"
              fill={chassisFill}
              stroke={strokeCol}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="32,16 50,34 32,52 14,34"
              fill="#090a0d"
              stroke={strokeCol}
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </>
        );

      case 'shield':
        return (
          <>
            <path
              d="M12,12 L52,12 C52,36 32,58 32,58 C32,58 12,36 12,12 Z"
              fill={chassisFill}
              stroke={strokeCol}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M17,17 L47,17 C47,35 32,51 32,51 C32,51 17,35 17,17 Z"
              fill="#090a0d"
              stroke={strokeCol}
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </>
        );

      case 'capsule':
        return (
          <>
            <rect x="13" y="9" width="38" height="50" rx="19" fill={chassisFill} stroke={strokeCol} strokeWidth="2.5" />
            <rect x="18" y="14" width="28" height="40" rx="14" fill="#090a0d" stroke={strokeCol} strokeWidth="1" strokeOpacity="0.5" />
          </>
        );

      case 'heart':
        return (
          <>
            <path
              d="M32,56 C20,44 8,33 8,22 C8,13 14,8 23,8 C27.5,8 30.5,10.5 32,13 C33.5,10.5 36.5,8 41,8 C50,8 56,13 56,22 C56,33 44,44 32,56 Z"
              fill={chassisFill}
              stroke={strokeCol}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="32" cy="31" r="14" fill="#090a0d" stroke={strokeCol} strokeWidth="1" strokeOpacity="0.5" />
          </>
        );

      case 'octagon':
        return (
          <>
            <polygon
              points="20,10 44,10 56,22 56,46 44,58 20,58 8,46 8,22"
              fill={chassisFill}
              stroke={strokeCol}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="23,16 41,16 50,25 50,43 41,52 23,52 14,43 14,25"
              fill="#090a0d"
              stroke={strokeCol}
              strokeWidth="1"
              strokeOpacity="0.5"
            />
          </>
        );

      case 'squircle':
      default:
        return (
          <>
            <rect x="9" y="11" width="46" height="46" rx="14" fill={chassisFill} stroke={strokeCol} strokeWidth="2.5" />
            <rect x="14" y="16" width="36" height="36" rx="9" fill="#090a0d" stroke={strokeCol} strokeWidth="1" strokeOpacity="0.5" />
          </>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none ${
        isWalking ? 'transition-all duration-500' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Floating Emote Bubble above head */}
      {showEmoteBadge && (
        <div
          className={`absolute -top-7 px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-slate-700/80 shadow-md backdrop-blur-sm z-10 whitespace-nowrap ${
            badge.bg
          } ${badge.anim}`}
        >
          {badge.icon}
        </div>
      )}

      {/* Bot Robot Screen / Head with Selected Shape */}
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={`filter drop-shadow-md transition-transform duration-300 ${
          status === 'working' ? 'scale-105' : ''
        }`}
      >
        {/* Antenna */}
        {shape !== 'star' && shape !== 'heart' && (
          <g>
            <line x1="32" y1="2" x2="32" y2="10" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
            <circle
              cx="32"
              cy="2.5"
              r="2.5"
              fill={status === 'working' ? '#10b981' : status === 'blocked' ? '#f43f5e' : color}
              className={status === 'working' ? 'animate-ping' : ''}
            />
          </g>
        )}

        {/* Chassis Shape & Inner Screen */}
        {renderShapeChassis()}

        {/* Cheek Blush */}
        <circle cx="21" cy="37" r="2.2" fill="#f43f5e" opacity="0.4" />
        <circle cx="43" cy="37" r="2.2" fill="#f43f5e" opacity="0.4" />

        {/* Expressive Eyes based on Emote/Status */}
        {activeEmote === 'frustrated' || activeEmote === 'steam' ? (
          /* Frustrated gritted squint eyes (> <) */
          <g stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round">
            <line x1="22" y1="26" x2="27" y2="30" />
            <line x1="22" y1="34" x2="27" y2="30" />

            <line x1="42" y1="26" x2="37" y2="30" />
            <line x1="42" y1="34" x2="37" y2="30" />
          </g>
        ) : activeEmote === 'sweat' ? (
          /* Stressed / troubled eyes with sweat drop */
          <g>
            <circle cx="24" cy="29" r="2.8" fill="#f59e0b" />
            <circle cx="40" cy="29" r="2.8" fill="#f59e0b" />
            <path d="M47 22 C47 20 49.5 19 49.5 22 C49.5 24 47 24 47 22" fill="#38bdf8" />
          </g>
        ) : activeEmote === 'stars' ? (
          /* Triumphant star eyes (★ ★) */
          <g fill="#10b981">
            <polygon points="24,24 25,27 28,28 25,30 24,33 22,30 20,28 22,27" />
            <polygon points="40,24 41,27 44,28 41,30 40,33 38,30 36,28 38,27" />
          </g>
        ) : activeEmote === 'question' ? (
          /* Puzzled thinking eyes (one eyebrow raised) */
          <g fill="#f59e0b">
            <circle cx="24" cy="28" r="3" />
            <circle cx="40" cy="31" r="2.2" />
            <line x1="21" y1="23" x2="27" y2="25" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
          </g>
        ) : activeEmote === 'coffee' ? (
          /* Relaxed happy sleeping curves */
          <g stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d="M 21 29 Q 24 25 27 29" />
            <path d="M 37 29 Q 40 25 43 29" />
          </g>
        ) : activeEmote === 'lightbulb' ? (
          /* Focused working eyes with inner spark */
          <g>
            <circle cx="24" cy="29" r="3.2" fill="#10b981" />
            <circle cx="40" cy="29" r="3.2" fill="#10b981" />
            <circle cx="25" cy="28" r="1.2" fill="#ffffff" />
            <circle cx="41" cy="28" r="1.2" fill="#ffffff" />
          </g>
        ) : (
          /* Default cute anime smiling pupils */
          <g>
            <circle cx="24" cy="29" r="3" fill="#ffffff" />
            <circle cx="40" cy="29" r="3" fill="#ffffff" />
            <circle cx="25" cy="28" r="1" fill="#38bdf8" />
            <circle cx="41" cy="28" r="1" fill="#38bdf8" />
          </g>
        )}

        {/* Expressive Mouth */}
        {activeEmote === 'frustrated' || activeEmote === 'steam' ? (
          <path d="M 27 38 L 29 36 L 31 38 L 33 36 L 35 38 L 37 36" stroke="#f43f5e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        ) : activeEmote === 'sweat' ? (
          <path d="M 27 39 Q 32 35 37 39" stroke="#f59e0b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        ) : activeEmote === 'stars' ? (
          <path d="M 26 36 Q 32 43 38 36" stroke="#10b981" strokeWidth="1.8" fill="#10b981" fillOpacity="0.25" strokeLinecap="round" />
        ) : activeEmote === 'coffee' ? (
          <path d="M 28 36 Q 32 39 36 36" stroke="#94a3b8" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 27 36 Q 32 40 37 36" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
};
