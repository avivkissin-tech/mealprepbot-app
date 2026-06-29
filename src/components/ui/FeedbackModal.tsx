'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: Props) {
  const { locale } = useLanguage();
  const isHe = locale === 'he';
  const [type, setType] = useState<'bug' | 'suggestion'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleSubmit() {
    if (!title.trim()) return;
    setStatus('sending');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(26,25,24,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        dir={isHe ? 'rtl' : 'ltr'}
        style={{
          background: '#fff', borderRadius: 20,
          width: '100%', maxWidth: 480,
          padding: '28px 28px 24px',
          boxShadow: '0 20px 60px rgba(26,25,24,0.18)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1a1c1b', margin: '0 0 4px' }}>
              {isHe ? 'עזרו לנו להשתפר' : 'Help us improve'}
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(26,25,24,0.5)', margin: 0 }}>
              {isHe ? 'ספרו לנו על באג שמצאתם או רעיון לשיפור' : 'Tell us about a bug or improvement idea'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#A09893', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#14422d', margin: '0 0 6px' }}>
              {isHe ? 'תודה רבה!' : 'Thank you!'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(26,25,24,0.5)', margin: '0 0 20px' }}>
              {isHe ? 'הדיווח שלך נשמר. נקרא כל דיווח.' : 'Your report was saved. We read every one.'}
            </p>
            <button onClick={onClose} style={{ padding: '10px 24px', borderRadius: 9999, background: '#14422d', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              {isHe ? 'סגור' : 'Close'}
            </button>
          </div>
        ) : (
          <>
            {/* Type toggle */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#1a1c1b', margin: '0 0 8px' }}>
                {isHe ? 'סוג הדיווח' : 'Type'}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['bug', 'suggestion'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      padding: '7px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 600,
                      border: `1.5px solid ${type === t ? '#14422d' : '#E0D9CE'}`,
                      background: type === t ? '#14422d' : '#fff',
                      color: type === t ? '#fff' : '#6B6560',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {t === 'bug' ? (isHe ? 'באג' : 'Bug') : (isHe ? 'הצעה לשיפור' : 'Suggestion')}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#1a1c1b' }}>{isHe ? 'כותרת' : 'Title'}</label>
                <span style={{ fontSize: 11, color: '#A09893' }}>{title.length}/100</span>
              </div>
              <input
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 100))}
                placeholder={isHe ? 'במשפט אחד' : 'In one sentence'}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #E0D9CE', fontSize: 14, background: '#faf9f7',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#1a1c1b' }}>{isHe ? 'תיאור' : 'Description'}</label>
                <span style={{ fontSize: 11, color: '#A09893' }}>{description.length}/2000</span>
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 2000))}
                placeholder={isHe ? 'מה קרה / מה הייתם רוצים?' : 'What happened / what would you like?'}
                rows={5}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #E0D9CE', fontSize: 13, background: '#faf9f7',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {status === 'error' && (
              <p style={{ fontSize: 12, color: '#C9572A', marginBottom: 12 }}>
                {isHe ? 'שגיאה בשמירה. נסה שוב.' : 'Error saving. Please try again.'}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: isHe ? 'flex-start' : 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 9999, background: '#F0EBE3', border: 'none', color: '#6B6560', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {isHe ? 'ביטול' : 'Cancel'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || status === 'sending'}
                style={{
                  padding: '10px 24px', borderRadius: 9999,
                  background: !title.trim() || status === 'sending' ? '#c0c9c1' : '#14422d',
                  color: '#fff', fontWeight: 600, fontSize: 13,
                  border: 'none', cursor: !title.trim() || status === 'sending' ? 'default' : 'pointer',
                }}
              >
                {status === 'sending' ? (isHe ? 'שולח...' : 'Sending...') : (isHe ? 'שליחה' : 'Submit')}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
