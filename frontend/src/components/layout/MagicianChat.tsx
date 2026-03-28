import { useState } from 'react';
import { askMagician } from '../../services/geminiPosture';
import type { AccountData } from '../../interfaces/AccountData.interface';
import MagicianBubble from './MagicianBubble';

interface MagicianChatProps {
  orgProfile: Record<string, unknown> | null;
  accountData: AccountData | null;
}

export default function MagicianChat({ orgProfile, accountData }: MagicianChatProps) {
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
    <div className="panel" style={{ flex: 1 }}>
      <div className="ptitle" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div className="mc-body">
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
          <button
            className="btn-ir"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            {loading ? 'CONSULTING…' : 'SEND'}
          </button>
          <div className="mc-suggestions">
            {suggestions.map(s => (
              <button
                key={s}
                className="mc-suggestion"
                onClick={() => handleSend(s)}
                disabled={loading}
              >
                {s}
              </button>
            ))}
          </div>
          {error && (
            <div className="mc-error">{error}</div>
          )}
        </div>
      )}
      <MagicianBubble answer={bubbleOpen ? answer : null} onClose={() => setBubbleOpen(false)} />
    </div>
  );
}
