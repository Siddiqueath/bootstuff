import { useState, useEffect } from 'react';

const Field = ({ label, hint, children }) => (
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{label}</p>
    {hint && <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{hint}</p>}
    {children}
  </div>
);

export default function SettingsPanel() {
  const [settings, setSettings] = useState({ chromePath: '', nircmdPath: '', startMinimized: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    window.bootstuff?.getSettings().then(s => {
      if (s) setSettings(prev => ({ ...prev, ...s }));
    });
  }, []);

  const save = async () => {
    await window.bootstuff?.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)', fontWeight: 600 }}>{title}</h3>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>
      {children}
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 520 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600 }}>Settings</h2>
        <button onClick={save} style={{
          background: saved ? 'var(--success)' : 'var(--accent)',
          color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans', transition: 'all 0.2s'
        }}>{saved ? '✓ Saved' : 'Save Settings'}</button>
      </div>

      <Section title="Paths">
        <Field label="Chrome Executable" hint="Full path to chrome.exe (used for opening URLs)">
          <input
            value={settings.chromePath}
            onChange={e => setSettings(s => ({ ...s, chromePath: e.target.value }))}
            placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"
            className="mono" style={{ fontSize: 11 }}
          />
        </Field>
        <Field label="NirCmd Path" hint="Path to nircmd.exe for volume control. Place in System32 or specify here.">
          <input
            value={settings.nircmdPath || ''}
            onChange={e => setSettings(s => ({ ...s, nircmdPath: e.target.value }))}
            placeholder="C:\Windows\System32\nircmd.exe"
            className="mono" style={{ fontSize: 11 }}
          />
        </Field>
      </Section>

      <Section title="Behavior">
        <Field label="Start Minimized to Tray">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => setSettings(s => ({ ...s, startMinimized: !s.startMinimized }))}
              style={{
                width: 36, height: 20, borderRadius: 99, transition: 'background 0.2s',
                background: settings.startMinimized ? 'var(--accent)' : 'var(--surface2)',
                border: '1px solid var(--border)', position: 'relative', cursor: 'pointer', flexShrink: 0
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 99, background: '#fff',
                position: 'absolute', top: 2, transition: 'left 0.2s',
                left: settings.startMinimized ? 18 : 2
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {settings.startMinimized ? 'Enabled — app starts in tray' : 'Disabled — settings window opens on launch'}
            </span>
          </label>
        </Field>
      </Section>

      <Section title="About">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <p style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 13 }}>BootStuff</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>v1.1.0 — Open Source (MIT)</p>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            Launch your entire work environment in one click. Define profiles with apps, browser tabs, terminal commands, volume and startup sounds.
          </p>
        </div>
      </Section>
    </div>
  );
}
