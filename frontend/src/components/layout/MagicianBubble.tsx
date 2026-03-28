import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  answer: string | null;
  onClose: () => void;
}

export default function MagicianBubble({ answer, onClose }: Props) {
  useEffect(() => {
    if (!answer) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [answer, onClose]);

  return createPortal(
    <AnimatePresence>
      {answer && (
        <motion.div
          className="mc-bubble"
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
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
