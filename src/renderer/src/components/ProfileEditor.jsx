import { useState } from 'react';
import ShortcutRecorder from './ShortcutRecorder';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'var(--muted)', fontWeight: 600 }}>{title}</h3>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
    {children}
  </div>
);

const Row = ({ children }) => (
  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>{children}</div>
);

const IconBtn = ({ onClick, danger, children, title }) => (
  <button onClick={onClick} title={title} style={{
    background: 'transparent', border: `1px solid ${danger ? 'var(--danger)' : 'var(--border)'}`,
    color: danger ? 'var(--danger)' : 'var(--muted)', width: 32, height: 32, borderRadius: 6,
    cursor: 'pointer', fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
  }}>{children}</button>
);

const AddBtn = ({ onClick, label }) => (
  <button onClick={onClick} style={{
    background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted)',
    borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12,
    fontFamily: 'DM Sans', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6
  }}>+ {label}</button>
);

const Label = ({ children }) => (
  <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
    {children}
  </p>
);

const CHROME_PROFILES = ['Default', 'Profile 1', 'Profile 2', 'Profile 3', 'Profile 4', 'Profile 5'];

export default function ProfileEditor({ profile, onChange, hints = {} }) {
  const update = (field, value) => onChange({ ...profile, [field]: value });

  // Apps
  const addApp = () => update('apps', [...(profile.apps || []), { path: '', args: '', delay: 500 }]);
  const updateApp = (i, field, val) => {
    const apps = [...profile.apps];
    apps[i] = { ...apps[i], [field]: val };
    update('apps', apps);
  };
  const removeApp = (i) => update('apps', profile.apps.filter((_, idx) => idx !== i));

  // URL Groups
  const addUrlGroup = () => update('urlGroups', [...(profile.urlGroups || []), { chromeProfile: 'Default', urls: [''] }]);
  const updateUrlGroup = (i, field, val) => {
    const groups = [...(profile.urlGroups || [])];
    groups[i] = { ...groups[i], [field]: val };
    update('urlGroups', groups);
  };
  const removeUrlGroup = (i) => update('urlGroups', (profile.urlGroups || []).filter((_, idx) => idx !== i));
  const addUrlToGroup = (gi) => {
    const groups = [...(profile.urlGroups || [])];
    groups[gi] = { ...groups[gi], urls: [...groups[gi].urls, ''] };
    update('urlGroups', groups);
  };
  const updateUrlInGroup = (gi, ui, val) => {
    const groups = [...(profile.urlGroups || [])];
    const urls = [...groups[gi].urls];
    urls[ui] = val;
    groups[gi] = { ...groups[gi], urls };
    update('urlGroups', groups);
  };
  const removeUrlFromGroup = (gi, ui) => {
    const groups = [...(profile.urlGroups || [])];
    groups[gi] = { ...groups[gi], urls: groups[gi].urls.filter((_, idx) => idx !== ui) };
    update('urlGroups', groups);
  };

  // Legacy single URLs
  const addUrl = () => update('urls', [...(profile.urls || []), { url: '', chromeProfile: 'Default' }]);
  const updateUrl = (i, field, val) => {
    const urls = [...profile.urls];
    urls[i] = { ...urls[i], [field]: val };
    update('urls', urls);
  };
  const removeUrl = (i) => update('urls', profile.urls.filter((_, idx) => idx !== i));

  // Commands
  const addCmd = () => update('commands', [...(profile.commands || []), { path: '', command: '' }]);
  const updateCmd = (i, field, val) => {
    const commands = [...profile.commands];
    commands[i] = { ...commands[i], [field]: val };
    update('commands', commands);
  };
  const removeCmd = (i) => update('commands', profile.commands.filter((_, idx) => idx !== i));

  // Import tasks.json into commands
  const importTasks = async () => {
    const result = await window.bootstuff?.scanTasksJson();
    if (!result) return;
    if (result.error) {
      alert(`tasks.json import: ${result.error}`);
      return;
    }
    const newCmds = result.map(t => ({ path: t.path, command: t.command, label: t.label || '' }));
    update('commands', [...(profile.commands || []), ...newCmds]);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 660 }}>

      {/* Profile Identity */}
      <Section title="Profile">
        <Row>
          <div style={{ width: 64 }}>
            <Label>Icon</Label>
            <input value={profile.icon} onChange={e => update('icon', e.target.value)}
              style={{ width: 56, textAlign: 'center', fontSize: 20, padding: '6px 4px' }} placeholder="🚀" />
          </div>
          <div style={{ flex: 1 }}>
            <Label>Name</Label>
            <input value={profile.name} onChange={e => update('name', e.target.value)} placeholder="Profile name" />
          </div>
        </Row>
        <div style={{ marginTop: 8 }}>
          <Label>Global Shortcut <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— launch this profile from anywhere</span></Label>
          <ShortcutRecorder
            value={profile.shortcut || ''}
            onChange={v => update('shortcut', v)}
          />
        </div>
      </Section>

      {/* Sound & Volume */}
      <Section title="Startup">
        <div style={{ marginBottom: 12 }}>
          <Label>Startup Sound (MP3 path)</Label>
          <input value={profile.sound} onChange={e => update('sound', e.target.value)}
            placeholder={hints.soundPlaceholder || "D:\\Music\\startup.mp3"} className="mono" style={{ fontSize: 12 }} />
        </div>
        <div>
          <Label>System Volume — {profile.volume}%</Label>
          <input type="range" min="0" max="100" value={profile.volume}
            onChange={e => update('volume', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }} />
        </div>
      </Section>

      {/* Apps */}
      <Section title="Apps to Launch">
        {(profile.apps || []).map((app, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Label>Executable Path</Label>
                <input value={app.path} onChange={e => updateApp(i, 'path', e.target.value)}
                  placeholder={hints.appPlaceholder || "C:\\Path\\To\\App.exe"} className="mono" style={{ fontSize: 11 }} />
              </div>
              <IconBtn onClick={() => removeApp(i)} danger title="Remove">✕</IconBtn>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <Label>Args (optional)</Label>
                <input value={app.args} onChange={e => updateApp(i, 'args', e.target.value)}
                  placeholder="--new-window" className="mono" style={{ fontSize: 11 }} />
              </div>
              <div style={{ width: 90 }}>
                <Label>Delay (ms)</Label>
                <input type="number" min="0" max="10000" step="100" value={app.delay ?? 500}
                  onChange={e => updateApp(i, 'delay', parseInt(e.target.value) || 0)}
                  style={{ fontSize: 12 }} />
              </div>
            </div>
          </div>
        ))}
        <AddBtn onClick={addApp} label="Add App" />
      </Section>

      {/* URL Groups */}
      <Section title="Browser Windows">
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Each group opens as one Chrome window with multiple tabs. Use separate groups for different Chrome profiles.
        </p>
        {(profile.urlGroups || []).map((group, gi) => (
          <div key={gi} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <Label>Chrome Profile</Label>
                <select value={group.chromeProfile} onChange={e => updateUrlGroup(gi, 'chromeProfile', e.target.value)}>
                  {CHROME_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <IconBtn onClick={() => removeUrlGroup(gi)} danger title="Remove group">✕</IconBtn>
            </div>
            <Label>URLs (each becomes a tab)</Label>
            {group.urls.map((url, ui) => (
              <div key={ui} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <input value={url} onChange={e => updateUrlInGroup(gi, ui, e.target.value)}
                  placeholder="https://example.com" className="mono" style={{ fontSize: 11 }} />
                {group.urls.length > 1 && (
                  <IconBtn onClick={() => removeUrlFromGroup(gi, ui)} danger title="Remove URL">✕</IconBtn>
                )}
              </div>
            ))}
            <button onClick={() => addUrlToGroup(gi)} style={{
              background: 'transparent', border: '1px dashed var(--border)', color: 'var(--muted)',
              borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 11,
              fontFamily: 'DM Sans', marginTop: 2
            }}>+ Add Tab</button>
          </div>
        ))}
        <AddBtn onClick={addUrlGroup} label="Add Chrome Window" />

        {/* Legacy single URLs (shown only if they exist) */}
        {(profile.urls || []).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Legacy single URLs</p>
            {(profile.urls || []).map((urlItem, i) => (
              <Row key={i}>
                <input value={urlItem.url} onChange={e => updateUrl(i, 'url', e.target.value)}
                  placeholder="https://example.com" className="mono" style={{ fontSize: 11 }} />
                <select value={urlItem.chromeProfile} onChange={e => updateUrl(i, 'chromeProfile', e.target.value)}
                  style={{ width: 120, flexShrink: 0 }}>
                  {CHROME_PROFILES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <IconBtn onClick={() => removeUrl(i)} danger title="Remove">✕</IconBtn>
              </Row>
            ))}
          </div>
        )}
      </Section>

      {/* Terminal Commands */}
      <Section title="Terminal Commands">
        {(profile.commands || []).map((cmd, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Label>Working Directory</Label>
                <input value={cmd.path} onChange={e => updateCmd(i, 'path', e.target.value)}
                  placeholder={hints.folderPlaceholder || "D:\\Project\\folder"} className="mono" style={{ fontSize: 11 }} />
              </div>
              <IconBtn onClick={() => removeCmd(i)} danger title="Remove">✕</IconBtn>
            </div>
            <div>
              <Label>Command{cmd.label ? ` — ${cmd.label}` : ''}</Label>
              <input value={cmd.command} onChange={e => updateCmd(i, 'command', e.target.value)}
                placeholder="npm run dev" className="mono" style={{ fontSize: 11 }} />
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <AddBtn onClick={addCmd} label="Add Command" />
          <button onClick={importTasks} title="Scan a folder for .vscode/tasks.json and import runOn:folderOpen tasks" style={{
            background: 'transparent', border: '1px dashed var(--border)', color: 'var(--accent)',
            borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: 12,
            fontFamily: 'DM Sans', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6
          }}>⬆ Import tasks.json</button>
        </div>
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 7, fontSize: 11, color: '#f59e0b', lineHeight: 1.5
        }}>
          <strong>VS Code tip:</strong> For <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>runOn: folderOpen</code> tasks to auto-run,
          enable <em>Tasks: Allow Automatic Tasks</em> in VS Code settings (<code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: 3 }}>task.allowAutomaticTasks: on</code>).
        </div>
      </Section>

    </div>
  );
}
