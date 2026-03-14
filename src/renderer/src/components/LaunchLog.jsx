export default function LaunchLog({ entries, profiles, onClear }) {
  const typeStyle = {
    start: { color: 'var(--accent)', symbol: '▶' },
    ok:    { color: 'var(--success)', symbol: '✓' },
    warn:  { color: '#f59e0b', symbol: '⚠' },
    error: { color: 'var(--danger)', symbol: '✕' },
    done:  { color: 'var(--success)', symbol: '★' },
  };

  const grouped = [];
  let currentGroup = null;
  for (const entry of entries) {
    if (entry.type === 'start') {
      const profile = profiles.find(p => p.id === entry.profileId);
      currentGroup = { profileId: entry.profileId, profileName: profile?.name || entry.profileId, icon: profile?.icon || '🚀', ts: entry.ts, items: [] };
      grouped.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.items.push(entry);
    }
  }

  if (grouped.length === 0) {
    return (
      <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <p style={{ fontSize: 14 }}>No launches yet</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Launch a profile to see activity here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Launch History</h2>
        <button onClick={onClear} style={{
          background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)',
          borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'DM Sans'
        }}>Clear</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[...grouped].reverse().map((group, gi) => (
          <div key={gi} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, overflow: 'hidden'
          }}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              borderBottom: '1px solid var(--border)', background: 'var(--surface2)'
            }}>
              <span style={{ fontSize: 16 }}>{group.icon}</span>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{group.profileName}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                {new Date(group.ts).toLocaleTimeString()}
              </span>
              {group.items.some(i => i.type === 'error') && (
                <span style={{ background: 'var(--danger)', color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>
                  {group.items.filter(i => i.type === 'error').length} error(s)
                </span>
              )}
              {group.items[group.items.length - 1]?.type === 'done' && (
                <span style={{ background: 'var(--success)', color: '#000', fontSize: 10, padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>
                  Done
                </span>
              )}
            </div>

            {/* Log lines */}
            <div style={{ padding: '8px 0' }}>
              {group.items.map((item, ii) => {
                const style = typeStyle[item.type] || typeStyle.ok;
                return (
                  <div key={ii} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '4px 14px', fontSize: 12, fontFamily: 'Space Mono'
                  }}>
                    <span style={{ color: style.color, width: 12, flexShrink: 0 }}>{style.symbol}</span>
                    <span style={{ color: item.type === 'error' ? 'var(--danger)' : item.type === 'warn' ? '#f59e0b' : 'var(--text)' }}>
                      {item.message}
                    </span>
                    <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: 10, whiteSpace: 'nowrap' }}>
                      +{((item.ts - group.ts) / 1000).toFixed(1)}s
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
