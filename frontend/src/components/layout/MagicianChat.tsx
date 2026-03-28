import { useState } from 'react';
import { askMagician } from '../../services/geminiPosture';
import type { AccountData } from '../../interfaces/AccountData.interface';

interface MagicianChatProps {
  orgProfile: Record<string, unknown> | null;
  accountData: AccountData | null;
}

export default function MagicianChat({ orgProfile, accountData }: MagicianChatProps) {
  const [input, setInput] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await askMagician(input.trim(), orgProfile, accountData);
      setAnswer(result.answer);
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
    <div className="panel" style={{ flexShrink: 0 }}>
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
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            {loading ? 'CONSULTING…' : 'SEND'}
          </button>
          {error && (
            <div className="mc-error">{error}</div>
          )}
          {answer && !error && (
            <div className="mc-answer">
              <span className="mc-answer-marker">&#9664;</span> {answer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
