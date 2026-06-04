import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiMail, FiLock, FiUser, FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

// Bakery Logo SVG (small)
function BakeryLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="24" cy="36" rx="18" ry="4" fill="#F5D5DC" />
      <rect x="10" y="24" width="28" height="12" rx="3" fill="#E8899A" />
      <rect x="14" y="14" width="20" height="12" rx="3" fill="#C0576A" />
      <path d="M10 27 Q13 23 16 27 Q19 23 22 27 Q25 23 28 27 Q31 23 34 27 Q37 23 38 27" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M14 17 Q17 13 20 17 Q23 13 26 17 Q29 13 32 17 Q34 13 34 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <rect x="20" y="7" width="3" height="8" rx="1.5" fill="#8B2252" />
      <rect x="26" y="9" width="3" height="6" rx="1.5" fill="#D4A853" />
      <ellipse cx="21.5" cy="6.5" rx="1.5" ry="2" fill="#F0CC87" />
      <ellipse cx="27.5" cy="8.5" rx="1.5" ry="2" fill="#F0CC87" />
    </svg>
  );
}

function InputField({ label, id, type = 'text', value, onChange, icon: Icon, placeholder, error, rightElement }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-chocolate/80 mb-1.5">
        {label}
      </label>
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all bg-white/60 backdrop-blur-sm ${
        error ? 'border-red-300 bg-red-50/50' : 'border-cream-200 focus-within:border-rose-bakery focus-within:bg-white'
      }`}>
        <Icon size={16} className={error ? 'text-red-400' : 'text-chocolate/40'} />
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-chocolate placeholder-chocolate/30 outline-none"
          autoComplete={id}
        />
        {rightElement}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <FiAlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sign in fields
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siErrors, setSiErrors] = useState({});

  // Sign up fields
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suErrors, setSuErrors] = useState({});

  const { signIn, signUp } = useAuth();
  const overlayRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setTab('signin');
        setLoading(false);
        setSuccess('');
        setGlobalError('');
        setSiEmail(''); setSiPassword(''); setSiErrors({});
        setSuName(''); setSuEmail(''); setSuPassword(''); setSuConfirm(''); setSuErrors({});
        setShowPass(false); setShowConfirm(false);
      }, 300);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validateSignIn = () => {
    const errs = {};
    if (!siEmail) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siEmail)) errs.email = 'Invalid email address';
    if (!siPassword) errs.password = 'Password is required';
    setSiErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateSignUp = () => {
    const errs = {};
    if (!suName.trim()) errs.name = 'Full name is required';
    if (!suEmail) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suEmail)) errs.email = 'Invalid email address';
    if (!suPassword) errs.password = 'Password is required';
    else if (suPassword.length < 6) errs.password = 'At least 6 characters';
    if (!suConfirm) errs.confirm = 'Please confirm your password';
    else if (suPassword !== suConfirm) errs.confirm = 'Passwords do not match';
    setSuErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validateSignIn()) return;
    setLoading(true);
    setGlobalError('');
    try {
      await signIn(siEmail, siPassword);
      setSuccess('Welcome back! 🎂');
      setTimeout(onClose, 500);
    } catch (err) {
      setGlobalError(err.message === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setLoading(true);
    setGlobalError('');
    try {
      await signUp(suEmail, suPassword, suName.trim());
      setSuccess('Account created! Check your email to confirm. 🎉');
    } catch (err) {
      setGlobalError(err.message.includes('already registered')
        ? 'This email is already registered. Try signing in instead.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">

              {/* Header */}
              <div className="relative px-8 pt-8 pb-6 text-center bg-gradient-to-b from-rose-pale/60 to-transparent">
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-chocolate/60 hover:text-chocolate transition-all shadow-sm"
                  aria-label="Close"
                >
                  <FiX size={15} />
                </button>
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-rose-pale to-rose-bakery/20 rounded-2xl flex items-center justify-center shadow-md border border-rose-pale">
                    <BakeryLogo />
                  </div>
                </div>
                <h2 className="font-serif text-2xl font-bold text-chocolate">
                  {tab === 'signin' ? 'Welcome Back!' : 'Join Bakester'}
                </h2>
                <p className="text-sm text-chocolate/50 mt-1">
                  {tab === 'signin' ? 'Sign in to your account' : 'Create your free account'}
                </p>

                {/* Tabs */}
                <div className="flex gap-1 mt-5 p-1 bg-cream-100 rounded-xl">
                  {[{ id: 'signin', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setGlobalError(''); setSuccess(''); setSiErrors({}); setSuErrors({}); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                        tab === t.id
                          ? 'bg-white text-chocolate shadow-sm'
                          : 'text-chocolate/50 hover:text-chocolate'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="px-8 pb-8">
                {/* Success state */}
                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200"
                    >
                      <FiCheckCircle size={18} className="flex-shrink-0" />
                      <span className="text-sm font-medium">{success}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Global error */}
                <AnimatePresence>
                  {globalError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200"
                    >
                      <FiAlertCircle size={18} className="flex-shrink-0" />
                      <span className="text-sm font-medium">{globalError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {tab === 'signin' ? (
                    <motion.form
                      key="signin"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSignIn}
                      className="space-y-4"
                    >
                      <InputField
                        label="Email Address"
                        id="signin-email"
                        type="email"
                        value={siEmail}
                        onChange={(e) => { setSiEmail(e.target.value); setSiErrors((p) => ({ ...p, email: '' })); }}
                        icon={FiMail}
                        placeholder="you@example.com"
                        error={siErrors.email}
                      />
                      <InputField
                        label="Password"
                        id="signin-password"
                        type={showPass ? 'text' : 'password'}
                        value={siPassword}
                        onChange={(e) => { setSiPassword(e.target.value); setSiErrors((p) => ({ ...p, password: '' })); }}
                        icon={FiLock}
                        placeholder="••••••••"
                        error={siErrors.password}
                        rightElement={
                          <button type="button" onClick={() => setShowPass(!showPass)} className="text-chocolate/30 hover:text-chocolate/60">
                            {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          </button>
                        }
                      />

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-bakery to-rose-dark text-white font-semibold text-sm shadow-rose hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Signing in…
                          </span>
                        ) : 'Sign In'}
                      </motion.button>

                      <p className="text-center text-xs text-chocolate/40">
                        Don't have an account?{' '}
                        <button type="button" onClick={() => setTab('signup')} className="text-rose-bakery font-semibold hover:text-rose-dark">
                          Sign up free
                        </button>
                      </p>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleSignUp}
                      className="space-y-4"
                    >
                      <InputField
                        label="Full Name"
                        id="signup-name"
                        value={suName}
                        onChange={(e) => { setSuName(e.target.value); setSuErrors((p) => ({ ...p, name: '' })); }}
                        icon={FiUser}
                        placeholder="Sarah Johnson"
                        error={suErrors.name}
                      />
                      <InputField
                        label="Email Address"
                        id="signup-email"
                        type="email"
                        value={suEmail}
                        onChange={(e) => { setSuEmail(e.target.value); setSuErrors((p) => ({ ...p, email: '' })); }}
                        icon={FiMail}
                        placeholder="you@example.com"
                        error={suErrors.email}
                      />
                      <InputField
                        label="Password"
                        id="signup-password"
                        type={showPass ? 'text' : 'password'}
                        value={suPassword}
                        onChange={(e) => { setSuPassword(e.target.value); setSuErrors((p) => ({ ...p, password: '' })); }}
                        icon={FiLock}
                        placeholder="Min. 6 characters"
                        error={suErrors.password}
                        rightElement={
                          <button type="button" onClick={() => setShowPass(!showPass)} className="text-chocolate/30 hover:text-chocolate/60">
                            {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          </button>
                        }
                      />
                      <InputField
                        label="Confirm Password"
                        id="signup-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={suConfirm}
                        onChange={(e) => { setSuConfirm(e.target.value); setSuErrors((p) => ({ ...p, confirm: '' })); }}
                        icon={FiLock}
                        placeholder="Repeat password"
                        error={suErrors.confirm}
                        rightElement={
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-chocolate/30 hover:text-chocolate/60">
                            {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                          </button>
                        }
                      />

                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.02 }}
                        whileTap={{ scale: loading ? 1 : 0.98 }}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-bakery to-rose-dark text-white font-semibold text-sm shadow-rose hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Creating account…
                          </span>
                        ) : 'Create Account'}
                      </motion.button>

                      <p className="text-center text-xs text-chocolate/40">
                        Already have an account?{' '}
                        <button type="button" onClick={() => setTab('signin')} className="text-rose-bakery font-semibold hover:text-rose-dark">
                          Sign in
                        </button>
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
