'use client';

import { useState } from 'react';
import { recipes } from '@/data/recipes';

interface Stats {
  totalUsers: number;
  totalCooks: number;
  totalSavedUsers: number;
}

interface TopRecipe {
  id: string;
  count: number;
}

interface FeedbackItem {
  id?: string;
  clerk_id?: string | null;
  type: string;
  title: string;
  description?: string;
  created_at: string;
}

interface RecentUser {
  clerk_id: string;
  goal?: string;
  household_size?: number;
  prep_frequency?: string;
  completed_at?: string;
}

interface Props {
  stats: Stats;
  topRecipes: TopRecipe[];
  feedback: FeedbackItem[];
  recentUsers: RecentUser[];
}

export default function StudioClient({ stats, topRecipes, feedback, recentUsers }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'users'>('overview');
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r.nameHe]));

  function fmt(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', color: '#e8e6e1', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#14d97d', boxShadow: '0 0 8px #14d97d' }} />
            <span style={{ fontSize: 11, color: '#14d97d', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Easy PREP Studio</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>Admin Dashboard</h1>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Secret admin panel — not linked anywhere in the UI</p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Registered Users', value: stats.totalUsers, icon: '👤', color: '#5B7FA6' },
            { label: 'Cooking Sessions', value: stats.totalCooks, icon: '🍳', color: '#C9572A' },
            { label: 'Users with Saves', value: stats.totalSavedUsers, icon: '🔖', color: '#14422d' },
            { label: 'Feedback Items', value: feedback.length, icon: '💬', color: '#F7C948' },
          ].map(card => (
            <div key={card.label} style={{ background: '#1a1d27', borderRadius: 12, padding: '16px 18px', border: `1px solid ${card.color}30` }}>
              <span style={{ fontSize: 22 }}>{card.icon}</span>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '8px 0 2px' }}>{card.value.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: '#1a1d27', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {(['overview', 'feedback', 'users'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 18px', borderRadius: 7, fontSize: 12, fontWeight: 600,
                border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: activeTab === tab ? '#14422d' : 'none',
                color: activeTab === tab ? '#fff' : '#6B7280',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top Saved Recipes</h2>
            <div style={{ background: '#1a1d27', borderRadius: 12, overflow: 'hidden' }}>
              {topRecipes.length === 0 ? (
                <p style={{ padding: '20px', color: '#6B7280', fontSize: 13, margin: 0 }}>No data yet</p>
              ) : (
                topRecipes.map((r, i) => {
                  const max = topRecipes[0]?.count ?? 1;
                  return (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < topRecipes.length - 1 ? '1px solid #ffffff08' : 'none' }}>
                      <span style={{ fontSize: 12, color: '#6B7280', minWidth: 20 }}>#{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: '#e8e6e1', marginBottom: 4 }}>{recipeMap[r.id] ?? r.id}</div>
                        <div style={{ height: 4, background: '#ffffff10', borderRadius: 9999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#14422d', width: `${(r.count / max) * 100}%`, borderRadius: 9999 }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#14d97d', minWidth: 30, textAlign: 'right' }}>{r.count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Feedback tab */}
        {activeTab === 'feedback' && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feedback ({feedback.length})</h2>
            {feedback.length === 0 ? (
              <p style={{ color: '#6B7280', fontSize: 13 }}>No feedback yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {feedback.map((f, i) => {
                  const key = f.id ?? String(i);
                  const isExpanded = expandedFeedback === key;
                  return (
                    <div key={key} style={{ background: '#1a1d27', borderRadius: 10, overflow: 'hidden', border: '1px solid #ffffff08' }}>
                      <button
                        onClick={() => setExpandedFeedback(isExpanded ? null : key)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                      >
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: f.type === 'bug' ? '#7f1d1d' : '#14422d', color: '#fff', flexShrink: 0 }}>
                          {f.type}
                        </span>
                        <span style={{ fontSize: 13, color: '#e8e6e1', flex: 1, textAlign: 'right' }}>{f.title}</span>
                        <span style={{ fontSize: 11, color: '#6B7280', flexShrink: 0, marginRight: 8 }}>{fmt(f.created_at)}</span>
                        <span style={{ color: '#6B7280', fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                      </button>
                      {isExpanded && f.description && (
                        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #ffffff08' }}>
                          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '12px 0 0', lineHeight: 1.6, whiteSpace: 'pre-wrap', textAlign: 'right' }}>{f.description}</p>
                          {f.clerk_id && <p style={{ fontSize: 10, color: '#4B5563', margin: '8px 0 0' }}>user: {f.clerk_id.slice(0, 12)}...</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recent Users (last 10)</h2>
            <div style={{ background: '#1a1d27', borderRadius: 12, overflow: 'hidden' }}>
              {recentUsers.length === 0 ? (
                <p style={{ padding: '20px', color: '#6B7280', fontSize: 13, margin: 0 }}>No users yet</p>
              ) : (
                recentUsers.map((u, i) => (
                  <div key={u.clerk_id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < recentUsers.length - 1 ? '1px solid #ffffff08' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#14422d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                      {u.goal === 'eat-healthy' ? '🥗' : u.goal === 'save-money' ? '💰' : u.goal === 'save-time' ? '⏱' : '✨'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'monospace' }}>{u.clerk_id.slice(0, 16)}...</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF' }}>{u.prep_frequency} · {u.household_size} people</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#4B5563', flexShrink: 0 }}>
                      {u.completed_at ? fmt(u.completed_at) : '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
