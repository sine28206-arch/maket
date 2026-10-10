import React from 'react';

interface Props {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  layout?: 'horizontal' | 'vertical';
}

export const HanmaumEmblem: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs ${className}`}
    >
      {/* Outer Cyan Ring */}
      <circle cx="50" cy="50" r="46" stroke="#38BDF8" strokeWidth="3.5" fill="#FFFFFF" />
      {/* Inner Silver Ring */}
      <circle cx="50" cy="50" r="41" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
      {/* Central Orange Sun / Warm Circle */}
      <circle cx="50" cy="50" r="28" fill="#F97316" />
      {/* 3 Green Propeller / Clover Leaves (Top, Bottom-Right, Bottom-Left) */}
      <g>
        {/* Top Leaf */}
        <path
          d="M50 49 C43 38 41 22 50 14 C59 22 57 38 50 49 Z"
          fill="#059669"
          stroke="#047857"
          strokeWidth="0.8"
        />
        {/* Bottom-Right Leaf (rotated ~120 deg) */}
        <path
          d="M50 51 C59 47 74 53 79 64 C68 68 56 60 50 51 Z"
          fill="#10B981"
          stroke="#047857"
          strokeWidth="0.8"
        />
        {/* Bottom-Left Leaf (rotated ~240 deg) */}
        <path
          d="M50 51 C41 47 26 53 21 64 C32 68 44 60 50 51 Z"
          fill="#10B981"
          stroke="#047857"
          strokeWidth="0.8"
        />
        {/* Central Core Join Circle */}
        <circle cx="50" cy="50" r="4" fill="#047857" />
      </g>
    </svg>
  );
};

export const HanmaumLogo: React.FC<Props> = ({
  className = '',
  size = 'md',
  layout = 'horizontal'
}) => {
  const emblemSize = size === 'sm' ? 36 : size === 'lg' ? 64 : 48;
  const titleSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const subSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-xs' : 'text-[11px]';

  if (layout === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <HanmaumEmblem size={emblemSize} />
        <div className="mt-2.5">
          <div className={`${titleSize} font-black text-slate-900 tracking-tight leading-none`}>
            한마음초등학교
          </div>
          <div className={`${subSize} font-medium text-slate-500 tracking-wide mt-1 font-sans`}>
            Hanmaum Elementary School
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <HanmaumEmblem size={emblemSize} />
      <div className="flex flex-col text-left">
        <span className={`${titleSize} font-black text-slate-900 tracking-tight leading-tight`}>
          한마음초등학교
        </span>
        <span className={`${subSize} font-medium text-slate-500 tracking-wide font-sans`}>
          Hanmaum Elementary School
        </span>
      </div>
    </div>
  );
};
