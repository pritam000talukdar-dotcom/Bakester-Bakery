import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AnimatedSection from '../components/ui/AnimatedSection';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';

const contactInfo = [
  { icon: FiMapPin, label: 'Our Bakery', value: '123 Baker Street, New York, NY 10001' },
  { icon: FiPhone, label: 'Call Us', value: '+1 (800) 234-6413' },
  { icon: FiMail, label: 'Email Us', value: 'hello@bakesterbakery.com' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => setSent(false), 4000);
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="py-24 text-center bg-gradient-to-br from-cream-100 to-rose-pale/20">
        <div className="max-w-2xl mx-auto px-4">
          <AnimatedSection>
            <p className="text-xs text-rose-bakery font-semibold uppercase tracking-widest mb-4">Get In Touch</p>
            <h1 className="font-serif text-5xl lg:text-6xl font-bold text-chocolate mb-4">Let's Talk Sweetness</h1>
            <p className="text-chocolate/60 text-lg">
              Whether you have a question about our products, want to book a custom cake, or just want to say hello — we'd love to hear from you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatedSection direction="left">
                <h2 className="font-serif text-3xl font-bold text-chocolate mb-6">Come Find Us</h2>
                <div className="space-y-5">
                  {contactInfo.map((info) => (
                    <motion.div
                      key={info.label}
                      whileHover={{ x: 4 }}
                      className="flex items-start gap-4 p-4 bg-cream-50 rounded-2xl"
                    >
                      <div className="w-10 h-10 bg-rose-pale rounded-xl flex items-center justify-center flex-shrink-0">
                        <info.icon size={18} className="text-rose-bakery" />
                      </div>
                      <div>
                        <p className="text-xs text-chocolate/50 font-semibold uppercase tracking-wider mb-0.5">{info.label}</p>
                        <p className="text-sm text-chocolate font-medium">{info.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="text-sm font-semibold text-chocolate mb-4">Follow Our Journey</p>
                  <div className="flex gap-3">
                    {[
                      { icon: FiInstagram, href: '#', label: 'Instagram' },
                      { icon: FiFacebook, href: '#', label: 'Facebook' },
                      { icon: FiTwitter, href: '#', label: 'Twitter' },
                    ].map((s) => (
                      <motion.a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 rounded-full bg-rose-pale flex items-center justify-center text-rose-bakery hover:bg-rose-bakery hover:text-white transition-all"
                      >
                        <s.icon size={16} />
                      </motion.a>
                    ))}
                  </div>
                </div>

                {/* Hours */}
                <div className="mt-8 p-5 bg-chocolate rounded-2xl text-white">
                  <h4 className="font-serif text-lg font-bold mb-4">Bakery Hours</h4>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Monday – Friday', '8:00 AM – 8:00 PM'],
                      ['Saturday', '8:00 AM – 9:00 PM'],
                      ['Sunday', '9:00 AM – 6:00 PM'],
                    ].map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-white/70">{day}</span>
                        <span className="font-semibold">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <AnimatedSection direction="right">
                <motion.form
                  onSubmit={handleSubmit}
                  className="bg-cream-50 rounded-3xl p-8 lg:p-10 space-y-5"
                >
                  <h3 className="font-serif text-2xl font-bold text-chocolate mb-2">Send Us a Message</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-chocolate mb-2">Your Name</label>
                      <input
                        id="name" name="name" type="text" required
                        value={form.name} onChange={handleChange}
                        placeholder="Jane Doe" className="input-field"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-chocolate mb-2">Email Address</label>
                      <input
                        id="email" name="email" type="email" required
                        value={form.email} onChange={handleChange}
                        placeholder="jane@example.com" className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-chocolate mb-2">Subject</label>
                    <input
                      id="subject" name="subject" type="text"
                      value={form.subject} onChange={handleChange}
                      placeholder="Custom cake enquiry, order question..." className="input-field"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-chocolate mb-2">Message</label>
                    <textarea
                      id="message" name="message" rows={5} required
                      value={form.message} onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      className="input-field resize-none"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="btn-primary w-full py-4"
                  >
                    {sent ? '✓ Message Sent! We\'ll be in touch soon.' : 'Send Message'}
                  </motion.button>
                </motion.form>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
