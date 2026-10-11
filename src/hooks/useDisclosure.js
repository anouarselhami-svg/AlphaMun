import { useLayoutEffect, useRef, useState } from 'react';

export function useDisclosure() {
  const [expanded, setExpanded] = useState(false);
  const startRef = useRef(null);
  const restoreView = useRef(false);
  const toggle = () => {
    restoreView.current = expanded;
    setExpanded(!expanded);
  };
  useLayoutEffect(() => {
    if (!restoreView.current) return;
    restoreView.current = false;
    // Wait for the browser to finish adjusting scroll anchoring after hiding rows.
    const frame = requestAnimationFrame(() => {
      const start = startRef.current;
      const offset = (document.querySelector('header')?.getBoundingClientRect().height || 0) + 16;
      if (start && start.getBoundingClientRect().top < offset) {
        window.scrollTo({ top: Math.max(0, window.scrollY + start.getBoundingClientRect().top - offset), behavior: 'instant' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded]);
  return { expanded, toggle, reset: () => setExpanded(false), startRef };
}
