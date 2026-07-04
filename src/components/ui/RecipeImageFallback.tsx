'use client';

import { ChefHat } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm:  { icon: 24, fontSize: 10 },
  md:  { icon: 36, fontSize: 12 },
  lg:  { icon: 48, fontSize: 13 },
};

export default function RecipeImageFallback({ size = 'md' }: Props) {
  const { icon, fontSize } = SIZE_MAP[size];
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(135deg, #14422d 0%, #1d5c3e 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 6,
    }}>
      <ChefHat size={icon} strokeWidth={1.5} color="rgba(255,255,255,0.55)" />
      <span style={{ fontSize, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.04em' }}>
        Easy PREP
      </span>
    </div>
  );
}
