export default function TitleBar({ saved, dirty, onSave, view, onViewChange, onImportBat, logErrorCount }) {
  const logCount = logErrorCount;
  const NavBtn = ({ id, label }) => (
    <button
      onClick={() => onViewChange(id)}
      style={{
        background: view === id ? 'var(--surface2)' : 'transparent',
        border: view === id ? '1px solid var(--border)' : '1px solid transparent',
        color: view === id ? 'var(--text)' : 'var(--muted)',
        borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.15s',
        position: 'relative'
      }}
    >
      {label}
      {id === 'log' && logCount > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4, background: 'var(--danger)',
          color: '#fff', borderRadius: 99, width: 14, height: 14,
          fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
        }}>{logCount}</span>
      )}
    </button>
  );

  return (
    <div style={{
      height: 48, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 12px', WebkitAppRegion: 'drag', flexShrink: 0, gap: 8
    }}>
      {/* Left: brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 16 }}>⚡</span>
        <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 13, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>BootStuff</span>
        <span style={{ fontSize: 10, color: 'var(--muted)', background: 'var(--surface2)', padding: '1px 7px', borderRadius: 20, border: '1px solid var(--border)' }}>v1.1</span>
      </div>

      {/* Center: nav tabs */}
      <div style={{ display: 'flex', gap: 4, WebkitAppRegion: 'no-drag' }}>
        <NavBtn id="editor" label="Profiles" />
        <NavBtn id="log" label="Launch Log" />
        <NavBtn id="settings" label="Settings" />
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, WebkitAppRegion: 'no-drag' }}>
        <button onClick={onImportBat} title="Import .bat file" style={{
          background: 'transparent', border: '1px solid var(--border)',
          color: 'var(--muted)', borderRadius: 6, padding: '4px 10px',
          fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.15s', whiteSpace: 'nowrap'
        }}>⬆ Import .bat</button>

        <button onClick={onSave} style={{
          background: saved ? 'var(--success)' : 'var(--accent)',
          color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'DM Sans', whiteSpace: 'nowrap', position: 'relative'
        }}>
          {saved ? '✓ Saved' : 'Save'}
          {dirty && !saved && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 8, height: 8, borderRadius: '50%',
              background: '#fbbf24', border: '1.5px solid var(--surface)'
            }} title="Unsaved changes (Ctrl+S)" />
          )}
        </button>

        <button onClick={() => window.bootstuff?.minimizeWindow()} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--muted)', width: 26, height: 26, borderRadius: 5,
          cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>─</button>
        <button onClick={() => window.bootstuff?.closeWindow()} style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--muted)', width: 26, height: 26, borderRadius: 5,
          cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✕</button>
      </div>
    </div>
  );
}
