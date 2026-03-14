import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ProfileEditor from './components/ProfileEditor';
import TitleBar from './components/TitleBar';
import LaunchLog from './components/LaunchLog';
import SettingsPanel from './components/SettingsPanel';
import ConfirmModal from './components/ConfirmModal';

export default function App() {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [view, setView] = useState('editor'); // 'editor' | 'log' | 'settings'
  const [logEntries, setLogEntries] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // profile id to delete

  useEffect(() => {
    window.bootstuff?.getProfiles().then(p => {
      setProfiles(p);
      if (p.length > 0) setActiveProfileId(p[0].id);
    });
    window.bootstuff?.getLaunchLog().then(log => setLogEntries(log || []));
    window.bootstuff?.onLaunchLogEntry?.((entry) => {
      setLogEntries(prev => [...prev, entry]);
    });
  }, []);

  const profilesRef = useRef(profiles);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  // Ctrl+S to save — uses ref so it always has latest profiles
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        window.bootstuff?.saveProfiles(profilesRef.current).then(() => {
          setSaved(true);
          setDirty(false);
          setTimeout(() => setSaved(false), 2000);
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // stable — reads via ref

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  const updateProfile = useCallback((updated) => {
    setProfiles(prev => prev.map(p => p.id === updated.id ? updated : p));
    setDirty(true);
  }, []);

  const saveAll = async () => {
    await window.bootstuff?.saveProfiles(profiles);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const addProfile = () => {
    const newProfile = {
      id: Date.now().toString(),
      name: 'New Profile',
      icon: '🚀',
      volume: 50, sound: '',
      apps: [], urls: [], urlGroups: [], commands: []
    };
    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setView('editor');
  };

  const duplicateProfile = (id) => {
    const src = profiles.find(p => p.id === id);
    if (!src) return;
    const copy = {
      ...JSON.parse(JSON.stringify(src)),
      id: Date.now().toString(),
      name: `${src.name} (copy)`
    };
    setProfiles(prev => {
      const idx = prev.findIndex(p => p.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setActiveProfileId(copy.id);
    setView('editor');
  };

  const requestDelete = (id) => setConfirmDelete(id);

  const confirmDeleteProfile = () => {
    const id = confirmDelete;
    setProfiles(prev => {
      const updated = prev.filter(p => p.id !== id);
      if (activeProfileId === id) setActiveProfileId(updated[0]?.id || null);
      return updated;
    });
    setConfirmDelete(null);
  };

  const reorderProfiles = useCallback((reordered) => {
    setProfiles(reordered);
  }, []);

  const importBat = async () => {
    const imported = await window.bootstuff?.importBatFile();
    if (imported) {
      setProfiles(prev => [...prev, imported]);
      setActiveProfileId(imported.id);
      setView('editor');
    }
  };

  const launchProfile = (id) => {
    window.bootstuff?.launchProfile(id);
    setView('log');
  };

  const deletingProfile = profiles.find(p => p.id === confirmDelete);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      <TitleBar
        saved={saved}
        dirty={dirty}
        onSave={saveAll}
        view={view}
        onViewChange={setView}
        onImportBat={importBat}
        logErrorCount={logEntries.filter(e => e.type === 'error').length}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          profiles={profiles}
          activeProfileId={activeProfileId}
          onSelect={(id) => { setActiveProfileId(id); setView('editor'); }}
          onAdd={addProfile}
          onDelete={requestDelete}
          onDuplicate={duplicateProfile}
          onLaunch={launchProfile}
          onReorder={reorderProfiles}
        />

        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {view === 'log' && (
            <LaunchLog entries={logEntries} profiles={profiles} onClear={() => setLogEntries([])} />
          )}
          {view === 'settings' && <SettingsPanel />}
          {view === 'editor' && (
            activeProfile
              ? <ProfileEditor key={activeProfile.id} profile={activeProfile} onChange={updateProfile} />
              : <EmptyState onAdd={addProfile} onImport={importBat} />
          )}
        </main>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete profile?"
          message={`"${deletingProfile?.icon} ${deletingProfile?.name}" will be permanently removed. This cannot be undone.`}
          onConfirm={confirmDeleteProfile}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd, onImport }) {
  return (
    <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>
        <p style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No profiles yet</p>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
          Create a profile to define your startup environment, or import an existing{' '}
          <code style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>.bat</code> file.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={onAdd} style={{
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'DM Sans'
          }}>+ New Profile</button>
          <button onClick={onImport} style={{
            background: 'var(--surface2)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 8, padding: '8px 20px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans'
          }}>⬆ Import .bat</button>
        </div>
      </div>
    </div>
  );
}
