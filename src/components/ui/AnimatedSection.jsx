import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// ─── Safe mobile detection inside the component ──────────────────────────────
// Do NOT check window at module level — it can evaluate before the DOM is ready
// and produce wrong results on production mobile builds.
function useIsMobile() {
  return useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }, []);
}

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
}) {
  const isMobile = useIsMobile();

  const distance = isMobile ? 16 : 36;
  const duration = isMobile ? 0.3  : 0.6;
  const cappedDelay = isMobile ? Math.min(delay, 0.08) : delay;
  const amount = isMobile ? 0.05 : 0.12;

  const dirMap = {
    up:    { y: distance,  x: 0 },
    down:  { y: -distance, x: 0 },
    left:  { y: 0, x: -distance },
    right: { y: 0, x: distance },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...dirMap[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: cappedDelay,
      }}
    >
      {children}
    </motion.div>
  );
}
