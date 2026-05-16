'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, Flame, BookmarkCheck, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { recipes } from '@/data/recipes';

/* ─── Animated Stats Card ────────────────────────────────── */
interface AnimatedStatsCardProps {
  title: string;
  primaryValue: number;
  icon: React.ReactNode;
  delay?: number;
  className?: string;
}

const AnimatedStatsCard = React.forwardRef<HTMLDivElement, AnimatedStatsCardProps>(
  ({ title, primaryValue, icon, delay = 0, className }, _ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const isInView = useInView(cardRef, { once: true, margin: '-100px' });
    const spring = useSpring(0, { damping: 50, stiffness: 200, mass: 1 });
    const displayValue = useTransform(spring, (current) => Math.round(current));

    React.useEffect(() => {
      if (isInView) setTimeout(() => spring.set(primaryValue), delay);
    }, [isInView, primaryValue, spring, delay]);

    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: delay / 1000 }}
        className={cn(
          'relative flex flex-col overflow-hidden rounded-2xl p-6 shadow-lg',
          'bg-white border border-[#2A4F3A]/10',
          'hover:shadow-xl transition-all duration-300',
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium" style={{ color: 'rgba(26,25,24,0.7)' }}>
            {title}
          </h3>
          <div className="rounded-full p-2" style={{ background: 'rgba(42,79,58,0.1)', color: '#2A4F3A' }}>
            {icon}
          </div>
        </div>
        <motion.div className="text-4xl font-bold tracking-tight" style={{ color: '#1A1918' }}>
          {displayValue}
        </motion.div>
      </motion.div>
    );
  }
);
AnimatedStatsCard.displayName = 'AnimatedStatsCard';

/* ─── Donut Chart ────────────────────────────────────────── */
interface DonutChartProps {
  value: number;
  max: number;
  size?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ value, max, size = 200 }) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((value / max) * 100, 100);
  const offset = circumference - (progress / 100) * circumference;

  const pathRef = React.useRef<SVGCircleElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);
  const chartRef = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(chartRef, { once: true, margin: '-100px' });

  React.useEffect(() => {
    if (isInView) setIsVisible(true);
  }, [isInView]);

  React.useEffect(() => {
    if (isVisible && pathRef.current) {
      pathRef.current.animate(
        [{ strokeDashoffset: circumference }, { strokeDashoffset: offset }],
        { duration: 1500, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
      );
    }
  }, [isVisible, offset, circumference]);

  return (
    <div ref={chartRef} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A4F3A" />
            <stop offset="100%" stopColor="#C9572A" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E0D8" strokeWidth={strokeWidth} />
        <circle
          ref={pathRef}
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="url(#donutGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-4xl font-bold"
          style={{ color: '#1A1918' }}
        >
          {Math.round(progress)}%
        </motion.div>
        <div className="text-sm" style={{ color: 'rgba(26,25,24,0.6)' }}>השלמה</div>
      </div>
    </div>
  );
};

/* ─── Recipe Card — MOB style ────────────────────────────── */
interface RecipeCardProps {
  title: string;
  image: string;
  time: string;
  tags: string[];
  id: string;
  chef?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ title, image, time, tags, id, chef }) => (
  <Link href={`/recipes/${id}`} style={{ textDecoration: 'none' }}>
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(26,25,24,0.12)' }}
      transition={{ duration: 0.25 }}
      style={{
        background: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(26,25,24,0.07)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <div
          className="group-hover:scale-105 transition-transform duration-500"
          style={{
            width: '100%', height: '100%',
            backgroundImage: `url(${image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Dietary tag badge */}
        {tags[0] && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(26,25,24,0.75)', backdropFilter: 'blur(6px)',
            borderRadius: 20, padding: '3px 9px',
            fontSize: 11, fontWeight: 600, color: '#fff',
          }}>
            {tags[0]}
          </div>
        )}
      </div>
      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1A1918', marginBottom: 6, lineHeight: 1.3 }}>
          {title}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(26,25,24,0.5)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            {time} דק׳
          </div>
          {chef && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: '#2A4F3A', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: '#fff',
              }}>
                {chef.charAt(0)}
              </div>
              <span style={{ fontSize: 11, color: 'rgba(26,25,24,0.5)' }}>{chef}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  </Link>
);

const SAVED_IDS = ['crispy-salmon', 'chicken-shawarma', 'overnight-oats'];

const FILTERS = [
  { id: 'all',       label: 'כל המתכונים' },
  { id: 'saved',     label: 'שמורים' },
  { id: 'chicken',   label: 'עוף' },
  { id: 'fish',      label: 'דגים' },
  { id: 'beef',      label: 'בשר' },
  { id: 'turkey',    label: 'הודו' },
  { id: 'breakfast', label: 'ארוחת בוקר' },
  { id: 'salad',     label: 'סלטים' },
  { id: 'side',      label: 'תוספות' },
  { id: 'tofu',      label: 'טבעוני' },
];

/* ─── Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const stats = [
    { title: 'ארוחות הוכנו',    primaryValue: 64, icon: <TrendingUp className="h-5 w-5" />, delay: 0 },
    { title: 'שבועות רצופים',   primaryValue: 7,  icon: <Flame className="h-5 w-5" />,       delay: 200 },
    { title: 'מתכונים שמורים',  primaryValue: 3,  icon: <BookmarkCheck className="h-5 w-5" />, delay: 400 },
  ];

  const filteredRecipes = React.useMemo(() => {
    let list = recipes;
    if (activeFilter === 'saved') list = recipes.filter(r => SAVED_IDS.includes(r.id));
    else if (activeFilter !== 'all') list = recipes.filter(r => r.category === activeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(r =>
        r.nameHe.toLowerCase().includes(q) || r.nameEn.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeFilter, search]);

  return (
    <div dir="rtl" className="min-h-screen p-4 md:p-8" style={{ background: '#F7F3EE' }}>
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold"
            style={{ color: '#1A1918' }}
          >
            שלום, אביב
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-sm"
            style={{ color: 'rgba(26,25,24,0.5)' }}
          >
            עקוב אחר ההתקדמות שלך וגלה מתכונים חדשים
          </motion.p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <AnimatedStatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#2A4F3A]/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <h2 className="text-xl font-bold" style={{ color: '#1A1918' }}>התקדמות חודשית</h2>
              <p className="text-sm" style={{ color: 'rgba(26,25,24,0.6)' }}>
                השלמת 64 מתוך 80 ארוחות מתוכננות החודש. כל הכבוד!
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#2A4F3A' }} />
                  <span className="text-xs" style={{ color: 'rgba(26,25,24,0.7)' }}>הושלם</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#E5E0D8' }} />
                  <span className="text-xs" style={{ color: 'rgba(26,25,24,0.7)' }}>נותר</span>
                </div>
              </div>
            </div>
            <DonutChart value={64} max={80} size={180} />
          </div>
        </div>

        {/* Community Stats */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-[#2A4F3A]/10">
            <Users className="h-4 w-4" style={{ color: '#2A4F3A' }} />
            <span className="text-xs font-medium" style={{ color: '#1A1918' }}>4,821 משתמשים פעילים</span>
          </div>
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-[#2A4F3A]/10">
            <TrendingUp className="h-4 w-4" style={{ color: '#C9572A' }} />
            <span className="text-xs font-medium" style={{ color: '#1A1918' }}>1,203 ארוחות הוכנו היום</span>
          </div>
        </div>

        {/* ── Recipe Section ── */}
        <div className="space-y-4">
          {/* Search + title row */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold flex-shrink-0" style={{ color: '#1A1918' }}>מתכונים</h2>
            <div style={{ position: 'relative', maxWidth: 280, width: '100%' }}>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="rgba(26,25,24,0.4)" strokeWidth="2"
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="חפש מתכון..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 36px 8px 14px',
                  borderRadius: 9999,
                  border: '1px solid #E0D9CE',
                  background: '#fff',
                  fontSize: 13,
                  color: '#1A1918',
                  outline: 'none',
                  direction: 'rtl',
                }}
                onFocus={e => (e.target.style.borderColor = '#2A4F3A')}
                onBlur={e => (e.target.style.borderColor = '#E0D9CE')}
              />
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  flexShrink: 0,
                  padding: '6px 14px',
                  borderRadius: 9999,
                  border: activeFilter === f.id ? 'none' : '1px solid #E0D9CE',
                  background: activeFilter === f.id ? '#1A1918' : '#fff',
                  color: activeFilter === f.id ? '#F7F3EE' : '#1A1918',
                  fontSize: 13, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Recipe grid */}
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
          >
            {filteredRecipes.map((r) => (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <RecipeCard
                  id={r.id}
                  title={isHe ? r.nameHe : r.nameEn}
                  image={r.image}
                  time={String(r.prepTimeMin + r.cookTimeMin)}
                  tags={r.dietaryTags ?? []}
                  chef={r.chefName ?? 'אביב קיסין'}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredRecipes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(26,25,24,0.4)', fontSize: 14 }}>
              אין מתכונים בקטגוריה זו עדיין
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
