import { useEffect } from 'react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, danger = true }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '24px', width: 320,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          animation: 'fadeIn 0.15s ease'
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{danger ? '🗑️' : 'ℹ️'}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>{message}</p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text)', borderRadius: 7, padding: '7px 16px',
              fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans'
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              background: danger ? 'var(--danger)' : 'var(--accent)',
              border: 'none', color: '#fff', borderRadius: 7, padding: '7px 16px',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans'
            }}
          >{danger ? 'Delete' : 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}
