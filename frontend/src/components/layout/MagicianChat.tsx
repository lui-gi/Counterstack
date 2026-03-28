import { useRef, useState } from 'react';
import { askMagician } from '../../services/geminiPosture';
import type { AccountData } from '../../interfaces/AccountData.interface';
import MagicianBubble from './MagicianBubble';

interface MagicianChatProps {
  orgProfile: Record<string, unknown> | null;
  accountData: AccountData | null;
}

export default function MagicianChat({ orgProfile, accountData }: MagicianChatProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestions = [
    'What is my biggest threat right now?',
    'Which CVEs need immediate action?',
    'How can I improve my security posture?',
  ];

  async function handleSend(question?: string) {
    const q = question ?? input.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await askMagician(q, orgProfile, accountData);
      setAnswer(result.answer);
      setBubbleOpen(true);
      setInput('');
    } catch {
      setError('The Magician could not answer. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div ref={panelRef} className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="ptitle" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#39d353', borderBottom: '1px solid rgba(57,211,83,.15)' }}>
        <img src="/magician-icon.png" style={{ height: 16, objectFit: 'contain', flexShrink: 0 }} />
        Ask The Magician
      </div>
      {!orgProfile ? (
        <div style={{ padding: '14px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(205,217,229,0.22)', fontFamily: 'var(--fm)', letterSpacing: '.5px', lineHeight: 1.6, fontStyle: 'italic' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <img src="/magician-icon.png" style={{ height: 12, objectFit: 'contain', flexShrink: 0 }} />
              Connect your org profile to unlock The Magician
            </span>
          </div>
        </div>
      ) : (
        <div className="mc-body" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <textarea
            className="mc-input"
            rows={2}
            placeholder="Ask anything about your dashboard…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={500}
            disabled={loading}
          />
          <div className="mc-suggestions" style={{ marginTop: 8 }}>
            {suggestions.map(s => (
              <button
                key={s}
                className="mc-suggestion"
                style={{ background: 'rgba(57,211,83,.06)', borderColor: 'rgba(57,211,83,.18)', color: 'rgba(57,211,83,.55)' }}
                onClick={() => handleSend(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            className="btn-ir"
            style={{ marginTop: 'auto', paddingTop: 8, width: '100%',
              background: 'linear-gradient(135deg,rgba(57,211,83,.18),rgba(57,211,83,.08))',
              border: '1px solid rgba(57,211,83,.5)', color: '#39d353',
              textShadow: '0 0 8px rgba(57,211,83,.5)', boxShadow: '0 0 15px rgba(57,211,83,.1)' }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            {loading ? 'CONSULTING…' : 'SEND'}
          </button>
          {error && (
            <div className="mc-error">{error}</div>
          )}
        </div>
      )}
      <MagicianBubble answer={bubbleOpen ? answer : null} onClose={() => setBubbleOpen(false)} anchorRef={panelRef} />
    </div>
  );
}
