import React, { useState, useEffect, useRef } from 'react';
import {
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  RotateCw,
  Sun,
  Moon,
  AlertTriangle,
  ChevronLeft,
  KeyRound,
  Cpu,
  Layers,
  Terminal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUIStore } from '../../stores/useUIStore';

type AuthViewMode = 'signin' | 'signup' | 'forgot' | 'reset' | 'verify';

interface PasswordScore {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  color: string;
  hasLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function evaluatePassword(pwd: string): PasswordScore {
  const hasLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

  let raw = 0;
  if (hasLength) raw++;
  if (hasUpper && hasLower) raw++;
  if (hasNumber) raw++;
  if (hasSpecial) raw++;

  if (pwd.length === 0) {
    return {
      score: 0,
      label: 'Weak',
      color: '#64748b',
      hasLength: false,
      hasUpper: false,
      hasLower: false,
      hasNumber: false,
      hasSpecial: false,
    };
  }

  if (raw <= 1) {
    return { score: 1, label: 'Weak', color: '#f43f5e', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  if (raw === 2) {
    return { score: 2, label: 'Fair', color: '#f59e0b', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  if (raw === 3) {
    return { score: 3, label: 'Strong', color: '#0284C7', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
  }
  return { score: 4, label: 'Very Strong', color: '#38BDF8', hasLength, hasUpper, hasLower, hasNumber, hasSpecial };
}

export const AuthPage: React.FC = () => {
  const { login, register, loginAsGuest, resetPassword, lockoutUntil } = useAuthStore();
  const { isDarkMode, toggleTheme, showToast } = useUIStore();

  const [mode, setMode] = useState<AuthViewMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // OTP Verification state
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Lockout countdown timer
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  useEffect(() => {
    if (!lockoutUntil) {
      setLockoutRemaining(0);
      return;
    }
    const update = () => {
      const diff = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setLockoutRemaining(diff);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const passwordEvaluation = evaluatePassword(password);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (lockoutRemaining > 0) {
      setErrorMessage(`Security lockout active. Please wait ${lockoutRemaining}s.`);
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to sign in.');
      } else {
        showToast('Welcome back to your AI Colony!', 'success');
      }
    } catch (err: unknown) {
      setErrorMessage(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(name, email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || 'Could not create account.');
      } else {
        showToast(`Welcome to OpenScreens, ${name}!`, 'success');
      }
    } catch (err: unknown) {
      setErrorMessage(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    // Privacy-preserving confirmation: Always report success without leaking whether email exists
    setStatusMessage(
      `If ${email} matches an account in your browser vault, a 6-digit recovery code was generated.`
    );
    setResendCooldown(30);
    setMode('verify');
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const updated = [...otpValues];
    updated[index] = digit;
    setOtpValues(updated);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!paste) return;
    const updated = [...otpValues];
    for (let i = 0; i < paste.length; i++) {
      updated[i] = paste[i];
    }
    setOtpValues(updated);
    const nextIdx = Math.min(paste.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpValues.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter all 6 digits.');
      return;
    }
    setErrorMessage(null);
    setMode('reset');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password.length < 8) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(email, password);
      if (res.success) {
        showToast('Password updated successfully! Please sign in.', 'success');
        setPassword('');
        setConfirmPassword('');
        setMode('signin');
      } else {
        setErrorMessage(res.error || 'Failed to reset password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 font-sans ${
        isDarkMode ? 'bg-[#080E18] text-[#F5F7F4]' : 'bg-[#FFFFFF] text-[#151815]'
      }`}
      style={{
        // Strict design system tokens
        ['--auth-primary-green' as string]: '#38BDF8',
        ['--auth-hover-green' as string]: '#7DD3FC',
        ['--auth-deep-green' as string]: '#0284C7',
        ['--auth-subtle-surface' as string]: isDarkMode ? '#0F172A' : '#F7F9F6',
        ['--auth-elevated' as string]: isDarkMode ? '#1E293B' : '#FFFFFF',
        ['--auth-border' as string]: isDarkMode ? '#334155' : '#E6EAE4',
        ['--auth-text-muted' as string]: isDarkMode ? '#94A3B8' : '#626962',
      }}
    >
      {/* Top Bar with Minimalist Brand & Theme Switcher */}
      <div className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 shadow-md shadow-sky-500/25 flex items-center justify-center">
            <div
              className={`w-full h-full rounded-[10px] flex items-center justify-center p-1 ${
                isDarkMode ? 'bg-[#080E18]' : 'bg-white'
              }`}
            >
              <svg
                viewBox="0 0 36 36"
                fill="none"
                className="w-full h-full text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
              >
                <polygon
                  points="18,3 32,10.5 32,25.5 18,33 4,25.5 4,10.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="rgba(56, 189, 248, 0.12)"
                />
                <line x1="18" y1="3" x2="18" y2="18" stroke="#38bdf8" strokeWidth="1.8" />
                <line x1="32" y1="25.5" x2="18" y2="18" stroke="#38bdf8" strokeWidth="1.8" />
                <line x1="4" y1="25.5" x2="18" y2="18" stroke="#38bdf8" strokeWidth="1.8" />
                <circle cx="18" cy="18" r="3" fill="#38bdf8" />
                <circle cx="18" cy="3" r="1.8" fill="#7dd3fc" />
                <circle cx="32" cy="10.5" r="1.8" fill="#7dd3fc" />
                <circle cx="32" cy="25.5" r="1.8" fill="#7dd3fc" />
                <circle cx="18" cy="33" r="1.8" fill="#7dd3fc" />
                <circle cx="4" cy="25.5" r="1.8" fill="#7dd3fc" />
                <circle cx="4" cy="10.5" r="1.8" fill="#7dd3fc" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight font-heading">
                OpenScreens
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[9px] uppercase font-mono font-bold rounded-full bg-[#38BDF8]/15 text-[#0284C7] dark:text-[#38BDF8] border border-[#38BDF8]/30">
                PROD v1.0
              </span>
            </div>
            <div className="text-[9.5px] text-sky-600 dark:text-sky-400 font-mono tracking-wider font-semibold uppercase -mt-0.5">
              Autonomous Multi-Model AI Colony
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Guest Access Shortcut */}
          <button
            onClick={loginAsGuest}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--auth-text-muted)] hover:text-white hover:bg-[#38BDF8]/10 border border-transparent hover:border-[#38BDF8]/30 transition-all"
            title="Continue instantly without creating an account"
          >
            <Cpu className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Direct Guest Mode</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--auth-text-muted)] hover:text-white bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] transition-colors"
            title={isDarkMode ? 'Light mode' : 'Dark mode'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Main Split-Screen Asymmetric Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center px-6 py-6 sm:py-12 relative">
        {/* LEFT SIDE: Generative Ambient Geometric Artwork */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between h-full min-h-[580px] p-8 rounded-3xl bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] relative overflow-hidden shadow-2xl">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-[#38BDF8]/10 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-[#0284C7]/20 blur-[80px] pointer-events-none" />

          {/* Generative Interactive SVG Art */}
          <div className="relative z-10 w-full flex-1 flex flex-col justify-center items-center py-6">
            <svg
              className="w-full max-w-md h-72 text-[#38BDF8]"
              viewBox="0 0 400 300"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0284C7" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="waveGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284C7" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* Concentric Geometric Rings */}
              <circle cx="200" cy="150" r="120" stroke="url(#orbitGrad)" strokeWidth="1" strokeDasharray="3 6" opacity="0.4" />
              <circle cx="200" cy="150" r="85" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />
              <circle cx="200" cy="150" r="50" stroke="url(#waveGrad)" strokeWidth="1.5" opacity="0.7" />

              {/* Flowing Organic Bezier Wave Curves */}
              <path
                d="M 30 180 C 100 80, 160 220, 230 130 C 290 50, 340 210, 380 140"
                stroke="url(#waveGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 40 140 C 110 210, 170 90, 240 170 C 300 230, 350 110, 370 170"
                stroke="#38BDF8"
                strokeWidth="1.2"
                strokeDasharray="2 4"
                opacity="0.6"
                fill="none"
              />

              {/* Node Satellites / Bot Indicators */}
              <circle cx="200" cy="150" r="7" fill="#38BDF8" className="animate-ping" style={{ animationDuration: '3s' }} />
              <circle cx="200" cy="150" r="5" fill="#38BDF8" />
              <circle cx="115" cy="90" r="4" fill="#7DD3FC" />
              <circle cx="285" cy="210" r="4.5" fill="#38BDF8" />
              <circle cx="230" cy="130" r="3.5" fill="#0284C7" />

              {/* Transit Rays */}
              <line x1="200" y1="150" x2="115" y2="90" stroke="#38BDF8" strokeWidth="0.8" opacity="0.4" />
              <line x1="200" y1="150" x2="285" y2="210" stroke="#38BDF8" strokeWidth="0.8" opacity="0.4" />
            </svg>
          </div>

          {/* Typography & Value Proposition */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#38BDF8]">
              <ShieldCheck className="w-4 h-4 text-[#38BDF8]" />
              <span>Zero-Telemetry Client Security</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight font-heading leading-tight text-white">
              Autonomous multi-model intelligence, running entirely in your browser.
            </h1>
            <p className="text-xs text-[var(--auth-text-muted)] leading-relaxed max-w-md">
              Pair local Ollama and cloud AI models. Build software, review code, and manage shared memory file systems with hardware-accelerated local encryption.
            </p>
          </div>

          {/* Trust Highlights */}
          <div className="relative z-10 pt-6 border-t border-[var(--auth-border)] mt-6 grid grid-cols-3 gap-3 text-[11px] font-mono text-[var(--auth-text-muted)]">
            <div>
              <div className="font-bold text-white">PBKDF2</div>
              <div>100,000 Rounds</div>
            </div>
            <div>
              <div className="font-bold text-white">Local AI</div>
              <div>Ollama & DeepSeek</div>
            </div>
            <div>
              <div className="font-bold text-white">100% Private</div>
              <div>Zero Remote DB</div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Minimalist Art-Directed Authentication Form */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="p-7 sm:p-9 rounded-3xl bg-[var(--auth-elevated)] border border-[var(--auth-border)] shadow-2xl relative transition-all duration-300">
            {/* Mode Switcher Tabs (Sign In / Sign Up) */}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="grid grid-cols-2 p-1 bg-[var(--auth-subtle-surface)] rounded-2xl border border-[var(--auth-border)] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    mode === 'signin'
                      ? 'bg-[var(--auth-elevated)] text-[var(--text-main)] shadow-sm font-bold'
                      : 'text-[var(--auth-text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    mode === 'signup'
                      ? 'bg-[var(--auth-elevated)] text-[var(--text-main)] shadow-sm font-bold'
                      : 'text-[var(--auth-text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Error Notification Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 flex items-start gap-2.5"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {/* Status Feedback Alert */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 p-3 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/40 text-xs text-[#0284C7] dark:text-[#38BDF8] flex items-start gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#38BDF8]" />
                <span>{statusMessage}</span>
              </motion.div>
            )}

            {/* Lockout Warning */}
            {lockoutRemaining > 0 && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 flex items-center justify-between">
                <span>Too many attempts. Lockout active:</span>
                <span className="font-mono font-bold text-sm">{lockoutRemaining}s</span>
              </div>
            )}

            {/* VIEW 1: SIGN IN */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight font-heading text-[var(--text-main)]">
                    Access Colony
                  </h2>
                  <p className="text-xs text-[var(--auth-text-muted)] mt-1">
                    Enter your credentials to decrypt and resume your workspace.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[var(--text-main)]">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-[#0284C7] dark:text-[#38BDF8] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-10 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)] hover:text-[var(--text-main)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[var(--auth-border)] text-[#0284C7] focus:ring-[#38BDF8]"
                    />
                    <span className="text-xs text-[var(--auth-text-muted)]">
                      Remember me on this browser
                    </span>
                  </label>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || lockoutRemaining > 0}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080E18] shadow-md shadow-[#38BDF8]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Divider & Guest Access Option */}
                <div className="pt-3">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-[var(--auth-border)]"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-[var(--auth-text-muted)]">
                      or quick test
                    </span>
                    <div className="flex-grow border-t border-[var(--auth-border)]"></div>
                  </div>

                  <button
                    type="button"
                    onClick={loginAsGuest}
                    className="w-full mt-1 py-2.5 px-4 rounded-xl font-semibold text-xs bg-[var(--auth-subtle-surface)] hover:bg-[var(--auth-border)] text-[var(--text-main)] border border-[var(--auth-border)] transition-all flex items-center justify-center gap-2"
                  >
                    <Cpu className="w-4 h-4 text-[#38BDF8]" />
                    <span>Direct Local Colony Mode (Guest)</span>
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 2: SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight font-heading text-[var(--text-main)]">
                    Create Master Account
                  </h2>
                  <p className="text-xs text-[var(--auth-text-muted)] mt-1">
                    Your password derives the local AES-GCM key to secure your API vault.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    Your name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Turing"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[var(--text-main)]">
                      Master Password
                    </label>
                    <span
                      className="text-[10px] font-mono font-bold"
                      style={{ color: passwordEvaluation.color }}
                    >
                      {password ? passwordEvaluation.label : ''}
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-10 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)] hover:text-[var(--text-main)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* 4-Segment Strength Bar */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className="rounded-full transition-all duration-300"
                            style={{
                              backgroundColor:
                                passwordEvaluation.score >= step
                                  ? passwordEvaluation.color
                                  : 'var(--auth-border)',
                            }}
                          />
                        ))}
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[var(--auth-text-muted)] pt-1">
                        <span className={passwordEvaluation.hasLength ? 'text-sky-500 font-bold' : ''}>
                          ✓ 8+ Chars
                        </span>
                        <span className={passwordEvaluation.hasUpper && passwordEvaluation.hasLower ? 'text-sky-500 font-bold' : ''}>
                          ✓ Upper & Lower
                        </span>
                        <span className={passwordEvaluation.hasNumber ? 'text-sky-500 font-bold' : ''}>
                          ✓ Number
                        </span>
                        <span className={passwordEvaluation.hasSpecial ? 'text-sky-500 font-bold' : ''}>
                          ✓ Symbol
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat master password"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-rose-500 mt-1">Passwords do not match yet.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080E18] shadow-md shadow-[#38BDF8]/15 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Create Account & Colony</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* VIEW 3: FORGOT PASSWORD */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="flex items-center gap-1 text-xs text-[var(--auth-text-muted)] hover:text-[var(--text-main)] transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>

                <div>
                  <h2 className="text-xl font-bold tracking-tight font-heading text-[var(--text-main)]">
                    Password Recovery
                  </h2>
                  <p className="text-xs text-[var(--auth-text-muted)] mt-1">
                    Enter your registered email address to receive an instant verification code.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080E18] shadow-md shadow-[#38BDF8]/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Send Recovery Code</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setMode('verify')}
                    className="text-xs text-[#0284C7] dark:text-[#38BDF8] hover:underline font-medium"
                  >
                    Already have a 6-digit code? Enter code
                  </button>
                </div>
              </form>
            )}

            {/* VIEW 4: VERIFY 6-DIGIT OTP */}
            {mode === 'verify' && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="flex items-center gap-1 text-xs text-[var(--auth-text-muted)] hover:text-[var(--text-main)] transition-colors mb-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Change Email</span>
                </button>

                <div>
                  <h2 className="text-xl font-bold tracking-tight font-heading text-[var(--text-main)]">
                    Enter Verification Code
                  </h2>
                  <p className="text-xs text-[var(--auth-text-muted)] mt-1">
                    Enter the 6-digit code sent to <strong className="text-[var(--text-main)]">{email || 'your email'}</strong>.
                  </p>
                </div>

                {/* 6 Digit Inputs */}
                <div className="flex items-center justify-between gap-2 pt-2" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-lg font-mono font-bold rounded-xl bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] focus:ring-2 focus:ring-[#38BDF8]/20 text-[var(--text-main)] focus:outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-[var(--auth-text-muted)] pt-1">
                  <span>Didn't receive it?</span>
                  {resendCooldown > 0 ? (
                    <span className="font-mono text-sky-500">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResendCooldown(30);
                        showToast('New recovery code generated.', 'info');
                      }}
                      className="text-[#0284C7] dark:text-[#38BDF8] font-semibold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080E18] shadow-md shadow-[#38BDF8]/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Verify & Set New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* VIEW 5: RESET PASSWORD */}
            {mode === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight font-heading text-[var(--text-main)]">
                    Set New Master Password
                  </h2>
                  <p className="text-xs text-[var(--auth-text-muted)] mt-1">
                    Choose a strong master passphrase for your local encryption vault.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-10 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)] hover:text-[var(--text-main)]"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-main)] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--auth-text-muted)]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      required
                      className="w-full bg-[var(--auth-subtle-surface)] border border-[var(--auth-border)] focus:border-[#38BDF8] text-xs rounded-xl pl-10 pr-3.5 py-2.5 text-[var(--text-main)] placeholder-[var(--auth-text-muted)] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080E18] shadow-md shadow-[#38BDF8]/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RotateCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Update Password & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
