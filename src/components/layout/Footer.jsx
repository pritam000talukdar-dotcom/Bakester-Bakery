import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

const footerLinks = {
  Bakery: [
    { label: 'Our Story', to: '/about' },
    { label: 'Speciality Cakes', to: '/speciality-cakes' },
    { label: 'Shop Now', to: '/products' },
    { label: 'Sustainability', to: '/about' },
  ],
  Support: [
    { label: 'FAQ', to: '/contact' },
    { label: 'Shipping Policy', to: '/contact' },
    { label: 'Return Policy', to: '/contact' },
    { label: 'Order Tracking', to: '/orders' },
  ],
  'Get In Touch': [
    { label: '123 Baker Street, NY', icon: FiMapPin },
    { label: 'hello@bakesterbakery.com', icon: FiMail },
    { label: '+1 800 234 6413', icon: FiPhone },
  ],
};

const socials = [
  { icon: FiInstagram, href: '#', label: 'Instagram' },
  { icon: FiFacebook, href: '#', label: 'Facebook' },
  { icon: FiTwitter, href: '#', label: 'Twitter' },
  { icon: FiYoutube, href: '#', label: 'YouTube' },
];

export default function Footer() {
  return (
    <footer className="bg-chocolate text-white/80">
      {/* Top wave */}
      <div className="overflow-hidden">
        <svg viewBox="0 0 1440 60" className="w-full fill-cream-100" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C360,0 1080,80 1440,20 L1440,0 L0,0 Z" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 flex-shrink-0">
                {/* Cake SVG logo */}
                <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="24" cy="36" rx="18" ry="4" fill="#F5D5DC" opacity="0.4" />
                  <rect x="10" y="24" width="28" height="12" rx="3" fill="#E8899A" />
                  <rect x="14" y="14" width="20" height="12" rx="3" fill="#C0576A" />
                  <path d="M10 27 Q13 23 16 27 Q19 23 22 27 Q25 23 28 27 Q31 23 34 27 Q37 23 38 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <path d="M14 17 Q17 13 20 17 Q23 13 26 17 Q29 13 32 17 Q34 13 34 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  <rect x="20" y="7" width="3" height="8" rx="1.5" fill="#8B2252" />
                  <rect x="26" y="9" width="3" height="6" rx="1.5" fill="#D4A853" />
                  <ellipse cx="21.5" cy="6.5" rx="1.5" ry="2" fill="#F0CC87" />
                  <ellipse cx="27.5" cy="8.5" rx="1.5" ry="2" fill="#F0CC87" />
                  <circle cx="15" cy="29" r="1" fill="white" opacity="0.8" />
                  <circle cx="33" cy="31" r="1" fill="white" opacity="0.8" />
                  <circle cx="24" cy="28" r="1" fill="white" opacity="0.8" />
                </svg>
              </div>
              <div className="leading-tight">
                <span className="block font-serif text-lg font-bold text-white group-hover:text-rose-light transition-colors">Bakester</span>
                <span className="block text-[10px] font-semibold text-rose-bakery uppercase tracking-widest">Bakery</span>
              </div>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mb-6">
              Crafting handmade moments since 2012. Every cake tells a story, every pastry holds a memory.
            </p>
            <div className="flex items-center gap-3">
              {socials.map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-rose-bakery text-white/70 hover:text-white transition-all duration-200"
                >
                  <s.icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-sm text-white/60 hover:text-rose-light transition-colors duration-200 flex items-center gap-2"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-white/60 flex items-center gap-2">
                        {link.icon && <link.icon size={13} className="text-rose-bakery flex-shrink-0" />}
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; 2024 Bakester Bakery. Artfully Crafted.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="text-xs text-white/40 hover:text-rose-light transition-colors">Privacy Policy</Link>
            <Link to="/contact" className="text-xs text-white/40 hover:text-rose-light transition-colors">Terms of Service</Link>
            <Link to="/products" className="text-xs text-white/40 hover:text-rose-light transition-colors">Shop Now</Link>
            <Link to="/about" className="text-xs text-white/40 hover:text-rose-light transition-colors">Sustainability</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
