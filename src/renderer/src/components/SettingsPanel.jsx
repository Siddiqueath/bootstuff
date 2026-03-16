import { useState, useEffect } from 'react';

const Toggle = ({ value, onChange, disabled }) => (
  <div
    onClick={() => !disabled && onChange(!value)}
    style={{
      width: 36, height: 20, borderRadius: 99, transition: 'background 0.2s',
      background: disabled ? 'var(--border)' : value ? 'var(--accent)' : 'var(--surface2)',
      border: '1px solid var(--border)', position: 'relative',
      cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: disabled ? 0.5 : 1
    }}
  >
    <div style={{
      width: 14, height: 14, borderRadius: 99, background: '#fff',
      position: 'absolute', top: 2, transition: 'left 0.2s',
      left: value ? 18 : 2
    }} />
  </div>
);

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
  const [startup, setStartup] = useState({ enabled: false, isDev: false, loading: true });
  const [startupStatus, setStartupStatus] = useState(null); // 'ok' | 'dev-warn' | null

  const [hints, setHints] = useState({});
  const [appVersion, setAppVersion] = useState('');
  const [updateInfo, setUpdateInfo] = useState(null);   // { version, url } if update available
  const [updateStatus, setUpdateStatus] = useState(null); // 'checking' | 'up-to-date' | null

  useEffect(() => {
    window.bootstuff?.getSettings().then(s => {
      if (s) setSettings(prev => ({ ...prev, ...s }));
    });
    window.bootstuff?.getUiHints?.().then(h => { if (h) setHints(h); }).catch(() => {});
    window.bootstuff?.getAppVersion?.().then(v => { if (v) setAppVersion(v); });
    window.bootstuff?.getUpdateInfo?.().then(info => { if (info) setUpdateInfo(info); });
    window.bootstuff?.onUpdateAvailable?.((info) => { setUpdateInfo(info); setUpdateStatus(null); });
    window.bootstuff?.onUpdateNotAvailable?.(() => setUpdateStatus('up-to-date'));
    // Guard: if IPC call fails or method doesn't exist, still clear loading
    const startupCall = window.bootstuff?.getStartupEnabled?.();
    if (!startupCall) {
      setStartup({ enabled: false, isDev: true, loading: false });
      return;
    }
    startupCall
      .then(res => {
        setStartup({ enabled: res?.enabled ?? false, isDev: res?.isDev ?? false, loading: false });
      })
      .catch(() => {
        setStartup({ enabled: false, isDev: true, loading: false });
      });
  }, []);

  const save = async () => {
    await window.bootstuff?.saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleStartup = async (enable) => {
    setStartup(s => ({ ...s, loading: true }));
    const res = await window.bootstuff?.setStartupEnabled(enable);
    if (res?.isDev) {
      setStartup(s => ({ ...s, loading: false }));
      setStartupStatus('dev-warn');
      setTimeout(() => setStartupStatus(null), 4000);
    } else {
      setStartup({ enabled: res?.enabled ?? enable, isDev: false, loading: false });
      setStartupStatus('ok');
      setTimeout(() => setStartupStatus(null), 2000);
    }
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

      {/* Paths */}
      <Section title="Paths">
        <Field label="Chrome Executable" hint="Full path to chrome.exe (used for opening URLs)">
          <input
            value={settings.chromePath}
            onChange={e => setSettings(s => ({ ...s, chromePath: e.target.value }))}
            placeholder={hints.chromePlaceholder || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"}
            className="mono" style={{ fontSize: 11 }}
          />
        </Field>
        {hints.nircmdVisible !== false && (
          <Field label="NirCmd Path" hint="Path to nircmd.exe for volume control. Place in System32 or specify here.">
            <input
              value={settings.nircmdPath || ''}
              onChange={e => setSettings(s => ({ ...s, nircmdPath: e.target.value }))}
              placeholder="C:\Windows\System32\nircmd.exe"
              className="mono" style={{ fontSize: 11 }}
            />
          </Field>
        )}
      </Section>

      {/* Startup & Behavior */}
      <Section title="Startup & Behavior">

        {/* Windows startup toggle */}
        <Field
          label="Launch at Windows startup"
          hint="Adds BootStuff to HKCU\Software\Microsoft\Windows\CurrentVersion\Run so it starts automatically when you log in."
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle
              value={startup.enabled}
              onChange={toggleStartup}
              disabled={startup.loading}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {startup.loading
                ? 'Checking…'
                : startup.enabled
                ? '✓ Enabled — BootStuff starts with Windows'
                : 'Disabled'}
            </span>
            {startupStatus === 'ok' && (
              <span style={{ fontSize: 11, color: 'var(--success)', marginLeft: 'auto' }}>
                {startup.enabled ? '✓ Added to startup' : '✓ Removed from startup'}
              </span>
            )}
            {startupStatus === 'dev-warn' && (
              <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 'auto' }}>
                Only works in built app
              </span>
            )}
          </div>

          {/* Dev mode notice */}
          {startup.isDev && (
            <div style={{
              marginTop: 10, padding: '8px 12px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 7, fontSize: 11, color: '#f59e0b', lineHeight: 1.6
            }}>
              <strong>Dev mode:</strong> This toggle only takes effect in the packaged app (<code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>npm run build</code>).
              In dev mode the Electron binary would be registered instead of BootStuff.exe.
            </div>
          )}
        </Field>

        {/* Start minimized */}
        <Field label="Start minimized to tray" hint="When enabled, opening BootStuff won't show the settings window — it goes straight to the tray.">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Toggle
              value={settings.startMinimized}
              onChange={v => setSettings(s => ({ ...s, startMinimized: v }))}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {settings.startMinimized ? 'Enabled — starts silently in tray' : 'Disabled — settings window opens on launch'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
            Pair this with "Launch at Windows startup" for a fully silent background launcher.
          </p>
        </Field>
      </Section>

      {/* About */}
      <Section title="About">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <p style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 13 }}>BootStuff</p>
              <p style={{ fontSize: 11, color: 'var(--muted)' }}>v{appVersion || '...'} — Open Source (MIT)</p>
            </div>
            <a
              href="https://github.com/Siddiqueath/bootstuff"
              target="_blank"
              rel="noreferrer"
              style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}
            >
              GitHub ↗
            </a>
          </div>

          {/* Update available banner */}
          {updateInfo && (
            <div style={{
              padding: '10px 12px', marginBottom: 12,
              background: 'rgba(124, 92, 252, 0.1)',
              border: '1px solid rgba(124, 92, 252, 0.4)',
              borderRadius: 7, display: 'flex', alignItems: 'center', gap: 10
            }}>
              <span style={{ fontSize: 16 }}>🆕</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                  v{updateInfo.version} is available
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted)' }}>You are on v{appVersion}</p>
              </div>
              <a
                href={updateInfo.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  borderRadius: 6, padding: '5px 12px', fontSize: 11,
                  fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
                  fontFamily: 'DM Sans'
                }}
              >
                Download ↗
              </a>
            </div>
          )}

          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>
            Launch your entire work environment in one click. Define profiles with apps, browser tabs, terminal commands, volume and startup sounds.
          </p>

          {/* Check for updates button */}
          <button
            onClick={async () => {
              setUpdateStatus('checking');
              await window.bootstuff?.checkForUpdates();
              // Response comes via onUpdateAvailable or onUpdateNotAvailable events
              setTimeout(() => setUpdateStatus(s => s === 'checking' ? 'up-to-date' : s), 5000);
            }}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--muted)', borderRadius: 6, padding: '5px 12px',
              fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            {updateStatus === 'checking' ? '⏳ Checking…'
              : updateStatus === 'up-to-date' ? "✓ You're up to date"
              : '🔄 Check for Updates'}
          </button>
        </div>
      </Section>
    </div>
  );
}
