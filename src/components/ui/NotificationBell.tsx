'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, BellOff, ShoppingCart, CalendarDays, CookingPot, Clock, Lightbulb, X, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { AppNotification } from '@/types';
import { MOCK_NOTIFICATIONS } from '@/data/notifications';

function typeIcon(type: AppNotification['type']) {
  const props = { size: 14, strokeWidth: 1.75 };
  switch (type) {
    case 'shopping-list': return <ShoppingCart {...props} />;
    case 'planner':       return <CalendarDays {...props} />;
    case 'prep-guide':    return <CookingPot {...props} />;
    case 'reminder':      return <Clock {...props} />;
    case 'recommendation': return <Lightbulb {...props} />;
  }
}

function typeColor(type: AppNotification['type']): string {
  switch (type) {
    case 'shopping-list':  return '#14422d';
    case 'planner':        return '#14422d';
    case 'prep-guide':     return '#C9572A';
    case 'reminder':       return '#6B6560';
    case 'recommendation': return '#C9572A';
  }
}

function typeBg(type: AppNotification['type']): string {
  switch (type) {
    case 'shopping-list':  return '#EBF2ED';
    case 'planner':        return '#EBF2ED';
    case 'prep-guide':     return '#FBF0EB';
    case 'reminder':       return '#F0EBE3';
    case 'recommendation': return '#FBF0EB';
  }
}

function formatRelativeTime(isoString: string, isHe: boolean): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (isHe) {
    if (mins < 2) return 'עכשיו';
    if (mins < 60) return `לפני ${mins} דקות`;
    if (hrs < 24) return `לפני ${hrs} שעות`;
    return `לפני ${days} ימים`;
  } else {
    if (mins < 2) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  }
}

export default function NotificationBell() {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unread = notifications.filter(n => !n.read);

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(v => !v)}
        aria-label={isHe ? 'התראות' : 'Notifications'}
        style={{
          position: 'relative',
          width: 32, height: 32,
          borderRadius: 8,
          background: open ? '#EBF2ED' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary, #6B6560)',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-hover, #F7F3EE)'; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <Bell size={16} strokeWidth={1.75} />
        {/* Unread badge */}
        {unread.length > 0 && (
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: '#C9572A',
            border: '1.5px solid var(--sidebar-bg, #fff)',
          }} />
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          dir={isHe ? 'rtl' : 'ltr'}
          style={{
            position: 'fixed',
            top: 60,
            [isHe ? 'right' : 'left']: 8,
            width: 320,
            zIndex: 9300,
            background: 'var(--bg-surface, #fff)',
            border: '1px solid var(--border, #E0D9CE)',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(26,25,24,0.14)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 10px',
            borderBottom: '1px solid var(--border-2, #F0EBE3)',
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #1a1c1b)' }}>
              {isHe ? 'התראות' : 'Notifications'}
              {unread.length > 0 && (
                <span style={{
                  marginInlineStart: 6, fontSize: 10, fontWeight: 700,
                  background: '#C9572A', color: '#fff',
                  padding: '1px 6px', borderRadius: 9999,
                }}>
                  {unread.length}
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: 10, fontWeight: 600,
                    color: '#14422d', background: '#EBF2ED',
                    border: 'none', borderRadius: 6,
                    padding: '3px 8px', cursor: 'pointer',
                  }}
                >
                  {isHe ? 'סמן הכול כנקרא' : 'Mark all read'}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label={isHe ? 'סגור' : 'Close'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted, #A09893)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 2,
                }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <BellOff size={28} strokeWidth={1.5} color="var(--text-muted, #A09893)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: 13, color: 'var(--text-muted, #A09893)', margin: 0 }}>
                  {isHe ? 'אין התראות חדשות' : 'No new notifications'}
                </p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-2, #F0EBE3)',
                    background: n.read ? 'transparent' : 'rgba(20,66,45,0.03)',
                    opacity: n.read ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {/* Type icon */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: typeBg(n.type), color: typeColor(n.type),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {typeIcon(n.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                        <p style={{
                          fontSize: 12, fontWeight: n.read ? 500 : 700,
                          color: 'var(--text-primary, #1a1c1b)',
                          margin: '0 0 2px', lineHeight: 1.4,
                        }}>
                          {isHe ? n.titleHe : n.titleEn}
                        </p>
                        {!n.read && (
                          <button
                            onClick={() => markRead(n.id)}
                            aria-label={isHe ? 'סמן כנקרא' : 'Mark as read'}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#14422d', padding: 0, flexShrink: 0,
                              display: 'flex', alignItems: 'center',
                            }}
                          >
                            <Check size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                      <p style={{
                        fontSize: 11, color: 'var(--text-secondary, #6B6560)',
                        margin: '0 0 6px', lineHeight: 1.5,
                      }}>
                        {isHe ? n.descriptionHe : n.descriptionEn}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted, #A09893)' }}>
                          {formatRelativeTime(n.createdAt, isHe)}
                        </span>
                        {n.actionUrl && (
                          <Link
                            href={n.actionUrl}
                            onClick={() => { markRead(n.id); setOpen(false); }}
                            style={{
                              fontSize: 10, fontWeight: 700,
                              color: '#14422d', textDecoration: 'none',
                            }}
                          >
                            {isHe ? (n.actionLabelHe ?? 'פתיחה') : (n.actionLabelEn ?? 'Open')} &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
