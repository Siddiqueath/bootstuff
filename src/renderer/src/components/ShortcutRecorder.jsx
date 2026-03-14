import { useState, useEffect, useRef } from 'react';

// Map browser KeyboardEvent keys → Electron accelerator keys
const KEY_MAP = {
  ' ': 'Space', 'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right',
  'Escape': 'Escape', 'Enter': 'Return', 'Backspace': 'Backspace', 'Delete': 'Delete',
  'Tab': 'Tab', 'Home': 'Home', 'End': 'End', 'PageUp': 'PageUp', 'PageDown': 'PageDown',
  'F1':'F1','F2':'F2','F3':'F3','F4':'F4','F5':'F5','F6':'F6',
  'F7':'F7','F8':'F8','F9':'F9','F10':'F10','F11':'F11','F12':'F12',
};

// Keys that are modifiers only — not valid as the final key
const MODIFIER_KEYS = new Set(['Control','Shift','Alt','Meta','OS','Win']);

// Build Electron accelerator string from a KeyboardEvent
function buildAccelerator(e) {
  const parts = [];
  if (e.ctrlKey)  parts.push('CommandOrControl');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey)   parts.push('Alt');
  if (e.metaKey)  parts.push('Super');  // Win key on Windows
  
  const key = e.key;
  if (MODIFIER_KEYS.has(key)) return null; // modifier-only, not complete yet
  
  const mappedKey = KEY_MAP[key] || (key.length === 1 ? key.toUpperCase() : null);
  if (!mappedKey) return null;
  
  parts.push(mappedKey);
  return parts.join('+');
}

// Human-readable display of an accelerator
function displayAccelerator(acc) {
  if (!acc) return '';
  return acc
    .replace('CommandOrControl', 'Ctrl')
    .replace('Super', '⊞ Win')
    .replace('Alt', 'Alt')
    .replace('Shift', 'Shift')
    .split('+')
    .map(k => `<kbd>${k}</kbd>`)
    .join(' + ');
}

export default function ShortcutRecorder({ value, onChange }) {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState(null); // null | 'checking' | 'ok' | 'taken' | 'invalid'
  const [display, setDisplay] = useState(value || '');
  const inputRef = useRef(null);

  // When value changes externally (e.g. profile switch), sync display
  useEffect(() => {
    setDisplay(value || '');
    setStatus(null);
  }, [value]);

  const startRecording = () => {
    setRecording(true);
    setStatus(null);
    setDisplay('');
    inputRef.current?.focus();
  };

  const stopRecording = () => setRecording(false);

  const handleKeyDown = async (e) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();

    // Escape cancels recording and restores previous value
    if (e.key === 'Escape') {
      setRecording(false);
      setDisplay(value || '');
      return;
    }

    const accelerator = buildAccelerator(e);
    if (!accelerator) return; // incomplete combo, wait for non-modifier key

    setDisplay(accelerator);
    setRecording(false);
    setStatus('checking');

    try {
      // Race IPC against 3s timeout — never get stuck on 'checking'
      const result = await Promise.race([
        window.bootstuff?.checkShortcut(accelerator) ?? Promise.resolve(null),
        new Promise(res => setTimeout(() => res(null), 3000))
      ]);

      // IPC unavailable or timed out — accept it, main process is the real gatekeeper
      if (!result) {
        setStatus('ok');
        onChange(accelerator);
        return;
      }

      if (result.taken)  { setStatus('taken');   return; }
      if (!result.valid) { setStatus('invalid');  return; }

      setStatus('ok');
      onChange(accelerator);
    } catch {
      setStatus('ok');
      onChange(accelerator);
    }
  };

  const clear = (e) => {
    e.stopPropagation();
    setDisplay('');
    setStatus(null);
    onChange('');
  };

  const statusColors = { ok: 'var(--success)', taken: 'var(--danger)', invalid: 'var(--danger)', checking: 'var(--muted)' };
  const statusMessages = {
    ok: '✓ Shortcut available',
    taken: '✕ Already in use by another app',
    invalid: '✕ Invalid key combination',
    checking: 'Checking…'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Recorder box */}
        <div
          ref={inputRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onBlur={stopRecording}
          onClick={startRecording}
          style={{
            flex: 1, minHeight: 36, padding: '6px 12px',
            background: recording ? 'rgba(124, 92, 252, 0.08)' : 'var(--surface2)',
            border: `1px solid ${recording ? 'var(--accent)' : status === 'taken' || status === 'invalid' ? 'var(--danger)' : status === 'ok' ? 'var(--success)' : 'var(--border)'}`,
            borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'border-color 0.15s, background 0.15s',
            outline: 'none', userSelect: 'none'
          }}
        >
          {recording ? (
            <span style={{ fontSize: 12, color: 'var(--accent)', fontStyle: 'italic' }}>
              ⌨ Press your shortcut…
            </span>
          ) : display ? (
            <span style={{ fontSize: 12, fontFamily: 'Space Mono', color: 'var(--text)' }}>
              {display.replace('CommandOrControl', 'Ctrl').replace('Super', '⊞Win').split('+').map((k, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: 'var(--muted)', margin: '0 3px' }}>+</span>}
                  <span style={{
                    display: 'inline-block', padding: '1px 7px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 4, fontSize: 11
                  }}>{k}</span>
                </span>
              ))}
            </span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Click to record shortcut</span>
          )}
        </div>

        {/* Clear button */}
        {display && !recording && (
          <button onClick={clear} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--muted)', borderRadius: 6, width: 32, height: 36,
            cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        )}
      </div>

      {/* Status message */}
      {status && (
        <p style={{ fontSize: 11, color: statusColors[status], marginTop: 0 }}>
          {statusMessages[status]}
        </p>
      )}

      {/* Hint */}
      {!recording && !display && (
        <p style={{ fontSize: 11, color: 'var(--muted)' }}>
          e.g. <span style={{ fontFamily: 'Space Mono' }}>Ctrl+Shift+W</span> or <span style={{ fontFamily: 'Space Mono' }}>⊞Win+Shift+W</span>
        </p>
      )}
    </div>
  );
}
