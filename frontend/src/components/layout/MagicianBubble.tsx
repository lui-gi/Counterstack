import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  answer: string | null;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

export default function MagicianBubble({ answer, onClose, anchorRef }: Props) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  useLayoutEffect(() => {
    if (!answer || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.top,
      right: window.innerWidth - rect.left + 12,
    });
  }, [answer, anchorRef]);

  useEffect(() => {
    if (!answer) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answer, onClose]);

  return createPortal(
    <AnimatePresence>
      {answer && pos && (
        <motion.div
          className="mc-bubble"
          style={{ top: pos.top, right: pos.right }}
          initial={{ opacity: 0, scale: 0.92, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.92, x: -8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="mc-bubble-header">
            <span className="mc-bubble-title">
              <img src="/magician-icon.png" style={{ height: 14, objectFit: 'contain', flexShrink: 0 }} />
              The Magician
            </span>
            <button className="mc-bubble-close" onClick={onClose}>✕</button>
          </div>
          <div className="mc-bubble-body">{answer}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
