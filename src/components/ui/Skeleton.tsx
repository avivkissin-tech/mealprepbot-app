'use client';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, className }: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-surface-2) 25%, var(--bg-hover) 50%, var(--bg-surface-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.4s infinite',
      }}
    />
  );
}

export function RecipeCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      borderRadius: 12,
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(26,25,24,0.07)',
    }}>
      <Skeleton height={150} borderRadius={0} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton height={16} width="80%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  );
}
