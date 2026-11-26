import { useState } from 'react';
import type { PortraitFrameId } from '../types/character';

export function PortraitAvatar({
  url,
  name,
  frame = 'gold-filigree',
  size = 'md',
}: {
  url?: string;
  name: string;
  frame?: PortraitFrameId;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [imgError, setImgError] = useState(false);

  const dims =
    size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-11 h-11 text-sm' : 'w-16 h-16 text-xl';

  const initials = (name || 'A')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={`${dims} rounded-[4px] overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-[#1b1e24] to-[#0f1115] text-[#e5e7eb] font-display font-bold select-none frame-${frame}`}
    >
      {url && !imgError ? (
        <img
          src={url}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initials || '⚔'}</span>
      )}
    </div>
  );
}
