import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../ui/AnimatedSection';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setEmail('');
    }
  };

  return (
    <section className="py-20 lg:py-28 bg-rose-pale/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection>
          <motion.div
            className="text-5xl mb-4"
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            🥐
          </motion.div>
          <h2 className="section-title text-chocolate mb-4">Join the Bakester Club</h2>
          <p className="text-chocolate/60 mb-10 max-w-lg mx-auto leading-relaxed">
            Be the first to know about seasonal selections, baking workshops, and receive an exclusive gift on your first order.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="input-field flex-1"
              aria-label="Email address"
              id="newsletter-email"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="btn-primary whitespace-nowrap"
            >
              {submitted ? '✓ Subscribed!' : 'Join Now'}
            </motion.button>
          </form>

          <p className="text-xs text-chocolate/40 mt-4">
            No spam, ever. Unsubscribe anytime.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
