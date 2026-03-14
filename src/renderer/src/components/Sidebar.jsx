import { useState, useRef } from 'react';

export default function Sidebar({ profiles, activeProfileId, onSelect, onAdd, onDelete, onLaunch, onDuplicate, onReorder }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragNode = useRef(null);

  const handleDragStart = (e, i) => {
    setDragIdx(i);
    dragNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Delay so the drag ghost doesn't show the "lifted" style
    setTimeout(() => dragNode.current?.classList.add('dragging'), 0);
  };

  const handleDragEnter = (e, i) => {
    e.preventDefault();
    if (i !== dragIdx) setOverIdx(i);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, i) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== i) {
      const reordered = [...profiles];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(i, 0, moved);
      onReorder(reordered);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    dragNode.current?.classList.remove('dragging');
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <div style={{
      width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>
          Profiles
          <span style={{ float: 'right', fontWeight: 400 }}>{profiles.length}</span>
        </p>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {profiles.map((profile, i) => {
          const isActive = activeProfileId === profile.id;
          const isDragging = dragIdx === i;
          const isOver = overIdx === i && dragIdx !== null && dragIdx !== i;

          return (
            <div
              key={profile.id}
              draggable
              onDragStart={e => handleDragStart(e, i)}
              onDragEnter={e => handleDragEnter(e, i)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelect(profile.id)}
              className="profile-row"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                background: isActive ? 'var(--surface2)' : 'transparent',
                border: isOver
                  ? '1px solid var(--accent)'
                  : isActive
                  ? '1px solid var(--border)'
                  : '1px solid transparent',
                opacity: isDragging ? 0.4 : 1,
                transition: 'all 0.12s',
                outline: 'none',
                boxShadow: isOver ? '0 0 0 2px rgba(124, 92, 252, 0.2)' : 'none'
              }}
            >
              {/* Drag handle */}
              <span style={{
                fontSize: 10, color: 'var(--border)', marginRight: 4, cursor: 'grab',
                userSelect: 'none', flexShrink: 0, lineHeight: 1
              }} title="Drag to reorder">⠿</span>

              {/* Icon + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 15, lineHeight: 1 }}>{profile.icon}</span>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: isActive ? 'var(--text)' : 'var(--muted)'
                }}>{profile.name}</span>
              </div>

              {/* Action buttons — visible on hover/active */}
              <div className="profile-actions" style={{
                display: 'flex', gap: 3,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 0.12s', flexShrink: 0
              }}>
                <ActionBtn
                  onClick={e => { e.stopPropagation(); onLaunch(profile.id); }}
                  title="Launch"
                  color="var(--accent)"
                  textColor="#fff"
                >▶</ActionBtn>
                <ActionBtn
                  onClick={e => { e.stopPropagation(); onDuplicate(profile.id); }}
                  title="Duplicate"
                >⧉</ActionBtn>
                <ActionBtn
                  onClick={e => { e.stopPropagation(); onDelete(profile.id); }}
                  title="Delete"
                  textColor="var(--danger)"
                  borderColor="rgba(248, 113, 113, 0.4)"
                >✕</ActionBtn>
              </div>
            </div>
          );
        })}

        {profiles.length === 0 && (
          <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            No profiles yet
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={onAdd} style={{
          width: '100%', background: 'transparent', border: '1px dashed var(--border)',
          color: 'var(--muted)', borderRadius: 7, padding: '7px', cursor: 'pointer',
          fontSize: 12, fontFamily: 'DM Sans', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
        }}>
          + New Profile
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, title, color, textColor, borderColor, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: color || 'transparent',
        border: `1px solid ${borderColor || 'var(--border)'}`,
        color: textColor || 'var(--muted)',
        width: 20, height: 20, borderRadius: 4,
        cursor: 'pointer', fontSize: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'opacity 0.1s'
      }}
    >{children}</button>
  );
}
