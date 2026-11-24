'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ApiException } from '@/lib/api';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Droplets,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AuthViewProps {
  initialMode?: 'login' | 'register';
}

export function AuthView({ initialMode = 'login' }: AuthViewProps) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [userType, setUserType] = useState<'customer' | 'admin'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Sync mode with props if initialMode changes
  useEffect(() => {
    setMode(initialMode);
    setFormError(null);
    setFieldErrors([]);
    setSuccessMessage(null);
  }, [initialMode]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setFormError(null);
    setFieldErrors([]);
    setSuccessMessage(null);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', newMode === 'register' ? '/register' : '/login');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setSuccessMessage(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFormError('Silakan lengkapi email dan password Anda.');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });

      let isAdmin = false;
      if (typeof window !== 'undefined') {
        try {
          const userObj = JSON.parse(localStorage.getItem('ensteinstore_user') || '{}');
          isAdmin = userObj.role === 'ADMIN';
        } catch {}
      }

      setSuccessMessage(
        isAdmin
          ? 'Login Admin berhasil! Mengalihkan ke dashboard...'
          : 'Login berhasil! Selamat datang di ENSTEINSTORE.'
      );

      setTimeout(() => {
        router.push(isAdmin ? '/admin/dashboard' : '/');
      }, 700);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.fieldErrors?.length) {
          setFieldErrors(err.fieldErrors);
        } else {
          setFormError(err.message || 'Email atau password salah.');
        }
      } else {
        setFormError('Terjadi kesalahan. Silakan periksa koneksi dan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setSuccessMessage(null);

    if (!registerName.trim()) {
      setFormError('Nama lengkap wajib diisi.');
      return;
    }
    if (!registerPhone.trim()) {
      setFormError('Nomor telepon aktif wajib diisi.');
      return;
    }
    if (!registerEmail.trim() || !registerEmail.includes('@')) {
      setFormError('Format email tidak valid.');
      return;
    }
    if (registerPassword.length < 8) {
      setFormError('Password harus minimal 8 karakter.');
      return;
    }
    if (!agreeTerms) {
      setFormError('Anda harus menyetujui Syarat & Ketentuan ENSTEINSTORE.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        fullName: registerName,
        phone: registerPhone,
        email: registerEmail,
        password: registerPassword,
      });

      setSuccessMessage('Akun berhasil didaftarkan! Silakan masuk dengan akun baru Anda.');
      setTimeout(() => {
        setMode('login');
        setLoginEmail(registerEmail);
        setRegisterPassword('');
        setSuccessMessage(null);
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', '/login');
        }
      }, 1400);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.fieldErrors?.length) {
          setFieldErrors(err.fieldErrors);
        } else {
          setFormError(err.message || 'Registrasi gagal. Email mungkin sudah terdaftar.');
        }
      } else {
        setFormError('Terjadi kesalahan. Silakan coba lagi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden flex flex-col bg-zinc-950 select-none">
      
      {/* =====================================================================
          1. FULL-BLEED RAIN-SUNSET BACKGROUND WITH RESPONSIVE CONTRAST OVERLAY
          ===================================================================== */}
      <Image
        src="/images/loginRegister/loginRegister.png"
        alt="ENSTEINSTORE Rainwear Background"
        fill
        priority
        className="w-full h-full object-cover select-none pointer-events-none"
      />

      {/* Responsive Contrast Overlay: Keeps mobile readable and desktop background crisp & luminous */}
      <div className="absolute inset-0 bg-zinc-950/45 backdrop-blur-[2px] lg:bg-black/15 lg:backdrop-blur-none pointer-events-none z-0" />

      {/* =====================================================================
          2. TOP FLOATING HEADER (Matches ELOVIA Header 1:1)
          ===================================================================== */}
      {/* Top-Left Brand Logo */}
      <div className="absolute top-4 left-6 lg:top-8 lg:left-12 z-20">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md p-1 flex items-center justify-center border border-white/30 shadow-md group-hover:scale-105 transition-transform duration-200">
            <img src="/ensteinlogo.png" alt="ENSTEINSTORE" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col drop-shadow-md">
            <span className="text-lg font-extrabold tracking-tight text-white uppercase leading-none">
              ENSTEIN<span className="text-amber-400 font-extrabold">STORE</span>
            </span>
            <span className="text-[9px] tracking-widest uppercase font-semibold text-white/80 mt-0.5">
              KEBUMEN • JAWA TENGAH
            </span>
          </div>
        </Link>
      </div>

      {/* Top-Right Decorative Slogan & Line */}
      <div className="absolute top-8 right-12 hidden md:flex items-center gap-4 text-white/85 text-sm font-light z-20 drop-shadow-sm pointer-events-none">
        {mode === 'login' ? (
          <>
            <span>Trusted Rainwear Materials &amp; Accessories</span>
            <div className="w-12 h-px bg-white/50" />
          </>
        ) : (
          <>
            <div className="w-12 h-px bg-white/50" />
            <span>Trusted Rainwear Materials &amp; Accessories</span>
          </>
        )}
      </div>

      {/* =====================================================================
          3. MIRRORED SPLIT VIEWPORT CONTENT (100dvh, Strictly Zero Scroll)
          ===================================================================== */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row overflow-hidden">
        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            /* =================================================================
               LOGIN MODE: Left Editorial + Right Glassmorphism Card
               ================================================================= */
            <motion.div
              key="login-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full h-full flex flex-col lg:flex-row"
            >
              {/* Left Column: Editorial Headline & Subtext */}
              <div className="hidden lg:flex relative z-10 w-1/2 h-full flex-col justify-center px-12 xl:px-24">
                {/* Ambient dark fade mask */}
                <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-black/65 via-black/30 to-transparent -z-10 pointer-events-none" />

                {/* Glass Pill Badge */}
                <div className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 w-max mb-6 text-xs sm:text-sm font-medium text-white shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>100% Waterproof • Material &amp; Konveksi</span>
                </div>

                {/* Editorial Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3.25rem] font-light leading-[1.18] tracking-tight text-white drop-shadow-lg mb-6">
                  Setiap tetes hujan, <br />
                  menuntut{' '}
                  <span className="font-serif italic font-normal text-amber-200 drop-shadow-xl">
                    perlindungan
                  </span>{' '}
                  <br />
                  terbaik.
                </h2>

                {/* Subtext */}
                <p className="text-white/95 font-normal text-sm sm:text-base leading-relaxed max-w-lg mb-8 [text-shadow:_0_2px_8px_rgba(0,0,0,0.75)]">
                  Bersama ENSTEINSTORE Kebumen, penuhi kebutuhan kain PVC, taslan, resleting
                  waterproof, dan komponen konveksi berkualitas tinggi.
                </p>

                {/* Explore CTA Pill Button */}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2.5 border border-white/40 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full px-6 py-2.5 text-white font-medium text-sm shadow-md transition-all duration-300 active:scale-95 group w-max"
                >
                  <Droplets className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Jelajahi Katalog</span>
                  <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Right Column: Pristine Glassmorphism Login Card */}
              <div className="relative z-10 w-full lg:w-1/2 h-full flex items-center justify-center p-3 sm:p-6 lg:p-12 flex-1 min-h-0">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/25 p-6 sm:p-8 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex flex-col max-h-[86dvh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
                  
                  {/* Top inner edge highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

                  {/* Centered Brand Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <img src="/ensteinlogo.png" alt="Logo" className="w-7 h-7 object-contain drop-shadow" />
                  </div>

                  {/* High-Contrast White Title & Subtitle */}
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md mb-1.5 text-center">
                    Selamat Datang Kembali
                  </h1>
                  <p className="text-xs sm:text-sm text-white/85 font-medium leading-relaxed drop-shadow-sm mb-5 text-center">
                    {userType === 'customer'
                      ? 'Masuk untuk melanjutkan belanja bahan jas hujan & komponen konveksi.'
                      : 'Masuk ke portal manajemen Toko Enstein (Akses Administrator).'}
                  </p>

                  {/* Segmented Control (Pelanggan | Admin Toko) with Framer Motion layoutId */}
                  <div className="flex bg-zinc-950/35 backdrop-blur-md p-1 rounded-2xl mb-5 border border-white/20 relative w-full flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setUserType('customer')}
                      className={`relative flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 ${
                        userType === 'customer' ? 'text-amber-800 font-bold' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {userType === 'customer' && (
                        <motion.div
                          layoutId="auth-user-type-indicator"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      Pelanggan
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('admin')}
                      className={`relative flex-1 py-2 text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 ${
                        userType === 'admin' ? 'text-amber-800 font-bold' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {userType === 'admin' && (
                        <motion.div
                          layoutId="auth-user-type-indicator"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      Admin Toko
                    </button>
                  </div>

                  {/* Error & Success Feedback Banners */}
                  {formError && (
                    <div className="bg-rose-500/25 backdrop-blur-md border border-rose-300/40 rounded-xl p-3 mb-4 text-xs text-rose-100 flex items-start gap-2 shadow-sm animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                      <p className="leading-snug">{formError}</p>
                    </div>
                  )}

                  {fieldErrors.length > 0 && (
                    <div className="bg-rose-500/25 backdrop-blur-md border border-rose-300/40 rounded-xl p-3 mb-4 space-y-1 text-xs text-rose-100 shadow-sm animate-in fade-in duration-200">
                      {fieldErrors.map((fe, i) => (
                        <p key={i}>• {fe.message}</p>
                      ))}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-emerald-500/30 backdrop-blur-md border border-emerald-300/40 rounded-xl p-3 mb-4 text-xs text-emerald-100 flex items-start gap-2 shadow-sm animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <p className="leading-snug font-medium">{successMessage}</p>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    {/* Email Input */}
                    <div className="relative flex items-center bg-white/15 border border-white/25 rounded-xl overflow-hidden focus-within:bg-white/22 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-amber-400/50 shadow-xs transition-all">
                      <Mail className="w-4 h-4 text-white/75 ml-3.5 shrink-0" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="Alamat Email"
                        className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-white/60 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative flex items-center bg-white/15 border border-white/25 rounded-xl overflow-hidden focus-within:bg-white/22 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-amber-400/50 shadow-xs transition-all">
                      <Lock className="w-4 h-4 text-white/75 ml-3.5 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-white/60 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="mr-3 text-white/70 hover:text-white transition-colors p-1"
                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Remember me & Forgot Password */}
                    <div className="flex items-center justify-between text-xs text-white/85 pt-1 pb-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 rounded border-white/30 bg-white/20 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span>Ingat saya</span>
                      </label>
                      <a
                        href="https://wa.me/6283876942484?text=Halo%20Admin%20ENSTEINSTORE,%20saya%20butuh%20bantuan%20reset%20password%20akun."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white transition-colors underline underline-offset-2"
                      >
                        Lupa password?
                      </a>
                    </div>

                    {/* Primary Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:opacity-95 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-amber-950/30 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>
                            {userType === 'admin'
                              ? 'Masuk sebagai Admin'
                              : 'Masuk sebagai Pelanggan'}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Mode Switch Footer */}
                  <p className="text-center text-xs text-white/85 mt-5">
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="font-bold text-amber-300 hover:text-amber-200 transition ml-1 cursor-pointer"
                    >
                      Daftar di sini &rarr;
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* =================================================================
               REGISTER MODE (Mirrored): Left Glassmorphism Card + Right Editorial
               ================================================================= */
            <motion.div
              key="register-layout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full h-full flex flex-col lg:flex-row"
            >
              {/* Left Column: Pristine Glassmorphism Register Card */}
              <div className="relative z-10 w-full lg:w-1/2 h-full flex items-center justify-center p-3 sm:p-6 lg:p-12 flex-1 min-h-0">
                <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/25 p-5 sm:p-7 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.45)] flex flex-col max-h-[86dvh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative">
                  
                  {/* Top inner edge highlight */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none" />

                  {/* Centered Brand Icon */}
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mx-auto mb-2 shadow-inner">
                    <img src="/ensteinlogo.png" alt="Logo" className="w-6 h-6 object-contain drop-shadow" />
                  </div>

                  {/* High-Contrast White Title & Subtitle */}
                  <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md mb-1 text-center">
                    Mulai Perjalanan Anda
                  </h1>
                  <p className="text-xs text-white/85 font-medium leading-relaxed drop-shadow-sm mb-4 text-center">
                    Daftar sekarang untuk kemudahan pemesanan eceran &amp; roll konveksi.
                  </p>

                  {/* Segmented Control (Pelanggan / Konveksi) */}
                  <div className="flex bg-zinc-950/35 backdrop-blur-md p-1 rounded-2xl mb-3.5 border border-white/20 relative w-full flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setUserType('customer')}
                      className={`relative flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 ${
                        userType === 'customer' ? 'text-amber-800 font-bold' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {userType === 'customer' && (
                        <motion.div
                          layoutId="auth-user-type-indicator-reg"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      Pelanggan / Konveksi
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUserType('admin');
                        setFormError('Akun Administrator dikelola internal oleh pemilik toko.');
                      }}
                      className={`relative flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-colors duration-200 z-10 ${
                        userType === 'admin' ? 'text-amber-800 font-bold' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      {userType === 'admin' && (
                        <motion.div
                          layoutId="auth-user-type-indicator-reg"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      Admin Toko
                    </button>
                  </div>

                  {/* Error & Success Feedback Banners */}
                  {formError && (
                    <div className="bg-rose-500/25 backdrop-blur-md border border-rose-300/40 rounded-xl p-2.5 mb-3 text-xs text-rose-100 flex items-start gap-2 shadow-sm animate-in fade-in duration-200">
                      <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
                      <p className="leading-snug">{formError}</p>
                    </div>
                  )}

                  {fieldErrors.length > 0 && (
                    <div className="bg-rose-500/25 backdrop-blur-md border border-rose-300/40 rounded-xl p-2.5 mb-3 space-y-0.5 text-xs text-rose-100 shadow-sm animate-in fade-in duration-200">
                      {fieldErrors.map((fe, i) => (
                        <p key={i}>• {fe.message}</p>
                      ))}
                    </div>
                  )}

                  {successMessage && (
                    <div className="bg-emerald-500/30 backdrop-blur-md border border-emerald-300/40 rounded-xl p-2.5 mb-3 text-xs text-emerald-100 flex items-start gap-2 shadow-sm animate-in fade-in duration-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <p className="leading-snug font-medium">{successMessage}</p>
                    </div>
                  )}

                  {/* Register Form (Compact 4 fields) */}
                  <form onSubmit={handleRegisterSubmit} className="space-y-2.5">
                    {/* Full Name */}
                    <div className="relative flex items-center bg-white/15 border border-white/25 rounded-xl overflow-hidden focus-within:bg-white/22 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-amber-400/50 shadow-xs transition-all">
                      <User className="w-4 h-4 text-white/75 ml-3.5 shrink-0" />
                      <input
                        type="text"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        placeholder="Nama Lengkap"
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="relative flex items-center bg-white/15 border border-white/25 rounded-xl overflow-hidden focus-within:bg-white/22 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-amber-400/50 shadow-xs transition-all">
                      <Phone className="w-4 h-4 text-white/75 ml-3.5 shrink-0" />
                      <input
                        type="tel"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="Nomor Telepon (WhatsApp)"
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="relative flex items-center bg-white/15 border border-white/25 rounded-xl overflow-hidden focus-within:bg-white/22 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-amber-400/50 shadow-xs transition-all">
                      <Mail className="w-4 h-4 text-white/75 ml-3.5 shrink-0" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="Alamat Email"
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Password */}
                    <div className="relative flex items-center bg-white/15 border border-white/25 rounded-xl overflow-hidden focus-within:bg-white/22 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-amber-400/50 shadow-xs transition-all">
                      <Lock className="w-4 h-4 text-white/75 ml-3.5 shrink-0" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Password (min. 8 karakter)"
                        className="w-full bg-transparent px-3 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="mr-3 text-white/70 hover:text-white transition-colors p-1"
                        aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Terms Agreement Checkbox */}
                    <div className="flex items-start gap-2 text-xs text-white/85 pt-0.5">
                      <input
                        type="checkbox"
                        id="reg-terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-white/30 bg-white/20 text-amber-500 focus:ring-0 focus:ring-offset-0 mt-0.5 cursor-pointer shrink-0"
                      />
                      <label htmlFor="reg-terms" className="leading-snug select-none cursor-pointer">
                        Saya menyetujui{' '}
                        <span className="font-semibold text-amber-200">Syarat &amp; Ketentuan</span>{' '}
                        serta Kebijakan Privasi ENSTEINSTORE.
                      </label>
                    </div>

                    {/* Primary Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 mt-1 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:opacity-95 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-amber-950/30 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Daftar sebagai Pelanggan</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Mode Switch Footer */}
                  <p className="text-center text-xs text-white/85 mt-4">
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="font-bold text-amber-300 hover:text-amber-200 transition ml-1 cursor-pointer"
                    >
                      Masuk di sini &rarr;
                    </button>
                  </p>
                </div>
              </div>

              {/* Right Column: Mirrored Editorial Headline & Subtext */}
              <div className="hidden lg:flex relative z-10 w-1/2 h-full flex-col justify-center items-end text-right px-12 xl:px-24">
                {/* Ambient dark fade mask on the RIGHT */}
                <div className="absolute inset-y-0 right-0 w-full bg-gradient-to-l from-black/65 via-black/30 to-transparent -z-10 pointer-events-none" />

                {/* Glass Pill Badge */}
                <div className="inline-flex items-center gap-2 border border-white/30 bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5 w-max mb-6 text-xs sm:text-sm font-medium text-white shadow-sm ml-auto">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Mitra &amp; Pelanggan ENSTEINSTORE</span>
                </div>

                {/* Right-Aligned Editorial Headline */}
                <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3.25rem] font-light leading-[1.18] tracking-tight text-white drop-shadow-lg mb-6 max-w-xl text-right ml-auto">
                  Kualitas konveksi, <br />
                  bermula dari{' '}
                  <span className="font-serif italic font-normal text-amber-200 drop-shadow-xl">
                    bahan pilihan
                  </span>{' '}
                  <br />
                  hari ini.
                </h2>

                {/* Right-Aligned Subtext */}
                <p className="text-white/95 font-normal text-sm sm:text-base leading-relaxed max-w-md mb-8 text-right ml-auto [text-shadow:_0_2px_8px_rgba(0,0,0,0.75)]">
                  Bergabung bersama ENSTEINSTORE. Pesan material eceran maupun partai besar dengan
                  stok real-time dan pengiriman cepat.
                </p>

                {/* Explore CTA Pill Button */}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2.5 border border-white/40 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-full px-6 py-2.5 text-white font-medium text-sm shadow-md transition-all duration-300 active:scale-95 group w-max ml-auto"
                >
                  <Droplets className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span>Jelajahi Katalog</span>
                  <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
