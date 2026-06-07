import React from 'react';
import { motion } from 'framer-motion';

// On mobile we use simpler, faster animations to avoid jank
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

const variants = {
  hidden: { opacity: 0, y: isMobile ? 20 : 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: isMobile ? 0.35 : 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
      delay,
    },
  }),
};

export default function AnimatedSection({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  once = true,
  // Higher amount threshold means mobile triggers animation sooner
  amount = isMobile ? 0.08 : 0.15,
}) {
  const dirMap = {
    up:    { y: isMobile ? 20 : 40, x: 0 },
    down:  { y: isMobile ? -20 : -40, x: 0 },
    left:  { y: 0, x: isMobile ? -20 : -40 },
    right: { y: 0, x: isMobile ? 20 : 40 },
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...dirMap[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration: isMobile ? 0.35 : 0.65,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: isMobile ? Math.min(delay, 0.1) : delay, // cap delay on mobile
      }}
    >
      {children}
    </motion.div>
  );
}
