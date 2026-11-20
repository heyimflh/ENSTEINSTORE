'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  ShieldCheck,
  Sparkles,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();

  // Primary tab state: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Form error state (for generic error message FR-02 & PRD 9.2.10)
  const [formError, setFormError] = useState<string | null>(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Register form state (FR-01: Full Name, Phone Number, Email, Password)
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Password validation helper (FR-01: Minimum 8 characters)
  const isPasswordValid = registerPassword.length >= 8;

  // Handle Login Submit (FR-02 & 9.2.10)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Basic empty check
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setFormError('Silakan lengkapi email dan password Anda.');
      return;
    }

    setIsLoading(true);

    // Simulate backend auth check
    setTimeout(() => {
      setIsLoading(false);

      // Trigger Generic Error Handling (FR-02 / PRD 9.2.10)
      // If user inputs "salah" or wrong credentials
      if (
        loginPassword === 'salah' ||
        loginEmail.toLowerCase().includes('wrong') ||
        (loginPassword.length < 6 && loginPassword !== 'admin123' && loginPassword !== 'demo123')
      ) {
        setFormError('Email atau password salah.');
        return;
      }

      // Successful login simulation
      const isAdmin = loginEmail.toLowerCase().includes('admin');
      const mockUser = {
        name: isAdmin ? 'Admin Toko Enstein' : 'Pelanggan Enstein',
        email: loginEmail,
        phone: '081234567890',
        role: isAdmin ? 'ADMIN' : 'CUSTOMER',
        avatarUrl: '',
      };

      try {
        localStorage.setItem('ensteinstore_auth_user', JSON.stringify(mockUser));
      } catch (err) {
        console.error('Storage error:', err);
      }

      setSuccessMessage(
        isAdmin
          ? 'Login Admin berhasil! Mengalihkan ke dashboard...'
          : 'Login berhasil! Selamat datang kembali di ENSTEINSTORE.'
      );

      setTimeout(() => {
        router.push('/');
      }, 1200);
    }, 700);
  };

  // Handle Register Submit (FR-01)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Strict validation
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

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Success registration simulation
      const newUser = {
        name: registerName,
        email: registerEmail,
        phone: registerPhone,
        role: 'CUSTOMER',
      };

      try {
        localStorage.setItem('ensteinstore_auth_user', JSON.stringify(newUser));
      } catch (err) {
        console.error('Storage error:', err);
      }

      setSuccessMessage('Akun Anda berhasil didaftarkan! Mengalihkan ke beranda...');
      setTimeout(() => {
        router.push('/');
      }, 1200);
    }, 800);
  };

  // Helper quick actions for evaluator / demo convenience
  const handleSimulateWrongPassword = () => {
    setLoginEmail('pelanggan@example.com');
    setLoginPassword('salah');
    setFormError('Email atau password salah.');
  };

  const handleFillDemoUser = (role: 'customer' | 'admin') => {
    setFormError(null);
    if (role === 'admin') {
      setLoginEmail('admin@ensteinstore.com');
      setLoginPassword('admin123');
    } else {
      setLoginEmail('customer@ensteinstore.com');
      setLoginPassword('demo123');
    }
  };

  return (
    <main className="min-h-screen flex w-full bg-white relative selection:bg-zinc-900 selection:text-white">
      {/* ========================================================================= */}
      {/* BACK TO HOME LINK (ABSOLUTE POSITIONED TOP CORNER)                       */}
      {/* ========================================================================= */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-10 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-medium text-zinc-500 hover:text-zinc-900 bg-white/90 hover:bg-zinc-100 border border-zinc-200/80 shadow-xs transition-all duration-200 hover:shadow-sm group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5 text-zinc-400 group-hover:text-zinc-900" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* LEFT COLUMN: EDITORIAL IMAGE SHOWCASE (DESKTOP ONLY)                     */}
      {/* ========================================================================= */}
      <section className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden select-none">
        {/* Editorial Fashion/Fabric Showcase Image */}
        <img
          src="/images/DB_GAMBAR_ENSTEINSTORE/Bahan/PVC-ALL.jpg"
          alt="ENSTEINSTORE Editorial Fabric & Rainwear Materials"
          className="object-cover w-full h-full opacity-90 mix-blend-overlay scale-105 filter brightness-90 contrast-110"
        />

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/60 via-transparent to-zinc-950/20" />

        {/* Top Left Branding Badge */}
        <div className="absolute top-10 left-12 z-20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-serif font-bold text-sm">
            E
          </div>
          <div className="flex flex-col">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              Toko Enstein
            </span>
            <span className="text-zinc-400 text-[10px] tracking-wider uppercase">
              Tanahsari, Kebumen
            </span>
          </div>
        </div>

        {/* Center / Bottom Editorial Branding & Tagline */}
        <div className="absolute bottom-12 left-12 right-12 z-20 flex flex-col justify-end text-white space-y-5">
          {/* Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 w-fit text-[11px] font-medium tracking-wider uppercase text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Waterproof Material Specialist</span>
          </div>

          {/* Core Brand Title */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white tracking-tight leading-tight">
              ENSTEINSTORE
            </h1>
            <p className="mt-3 text-sm xl:text-base text-zinc-300 font-light leading-relaxed max-w-lg">
              Spesialis bahan jas hujan PVC Balon, resleting waterproof heavy-duty,
              kancing snap presisi, dan perlengkapan konveksi berstandar industri.
            </p>
          </div>

          {/* Aesthetic Micro-Points */}
          <div className="pt-4 border-t border-white/15 grid grid-cols-3 gap-4 text-xs text-zinc-300">
            <div>
              <span className="block font-semibold text-white">Eceran & Rol</span>
              <span className="text-[11px] text-zinc-400">Mulai dari 0.1 meter</span>
            </div>
            <div>
              <span className="block font-semibold text-white">Material Grade A</span>
              <span className="text-[11px] text-zinc-400">100% Anti-Bocor</span>
            </div>
            <div>
              <span className="block font-semibold text-white">Pengiriman Cepat</span>
              <span className="text-[11px] text-zinc-400">Seluruh Indonesia</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: AUTHENTICATION FORM AREA (MOBILE & DESKTOP)                */}
      {/* ========================================================================= */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-20 relative">
        <div className="w-full max-w-md pt-12 sm:pt-6 pb-8">
          {/* Mobile Logo Only (Hidden on Desktop) */}
          <div className="lg:hidden text-2xl font-bold text-zinc-900 mb-8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-serif font-bold text-sm">
              E
            </div>
            <span className="tracking-tight">ENSTEINSTORE</span>
          </div>

          {/* Page Greeting & Subtitle */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
              {activeTab === 'login' ? 'Selamat Datang Kembali' : 'Bergabung Bersama Kami'}
            </h2>
            <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">
              {activeTab === 'login'
                ? 'Akses akun Anda untuk melihat status pesanan, riwayat belanja, dan katalog grosir.'
                : 'Daftarkan akun pelanggan untuk kemudahan belanja material jas hujan berkualitas.'}
            </p>
          </div>

          {/* ===================================================================== */}
          {/* SLEEK TAB SWITCHER (MASUK & DAFTAR)                                   */}
          {/* ===================================================================== */}
          <nav
            aria-label="Auth Tabs"
            className="flex gap-8 border-b border-zinc-200 mb-8"
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setFormError(null);
                setSuccessMessage(null);
              }}
              className={`text-base transition-colors duration-200 relative pb-4 outline-none ${
                activeTab === 'login'
                  ? 'border-b-2 border-zinc-900 text-zinc-900 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 cursor-pointer'
              }`}
            >
              Masuk
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setFormError(null);
                setSuccessMessage(null);
              }}
              className={`text-base transition-colors duration-200 relative pb-4 outline-none ${
                activeTab === 'register'
                  ? 'border-b-2 border-zinc-900 text-zinc-900 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 cursor-pointer'
              }`}
            >
              Daftar
            </button>
          </nav>

          {/* ===================================================================== */}
          {/* GENERIC ERROR BANNER (PRD 9.2.10 & FR-02)                             */}
          {/* ===================================================================== */}
          {formError && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium text-xs sm:text-sm">{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded transition-colors"
                aria-label="Tutup pesan error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* SUCCESS BANNER                                                        */}
          {/* ===================================================================== */}
          {successMessage && (
            <div
              role="status"
              className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-medium text-xs sm:text-sm">{successMessage}</span>
            </div>
          )}

          {/* ===================================================================== */}
          {/* CONDITIONAL RENDER: LOGIN FORM (FR-02)                                */}
          {/* ===================================================================== */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5" noValidate>
              {/* Email Input */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password Input with Lucide Eye / EyeOff Toggle */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Masukkan password Anda"
                    autoComplete="current-password"
                    required
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1 rounded-md transition-colors"
                    aria-label={showLoginPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Sub-actions: Remember Me & Lupa Password */}
                <div className="flex items-center justify-between mt-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-600">Ingat saya</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setForgotSubmitted(false);
                      setForgotEmail(loginEmail || '');
                    }}
                    className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                  >
                    Lupa Password?
                  </button>
                </div>
              </div>

              {/* Primary Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-zinc-900 text-white w-full rounded-full py-4 mt-8 font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Masuk ke Akun</span>
                )}
              </button>

              {/* DEMO / TEST SIMULATION HELPERS */}
              <div className="mt-8 pt-6 border-t border-zinc-100 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
                  <span>Pintasan Uji Coba Cepat</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleFillDemoUser('customer')}
                    className="px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-left transition-colors font-medium"
                  >
                    👤 Demo Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemoUser('admin')}
                    className="px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/80 text-zinc-700 text-left transition-colors font-medium"
                  >
                    🛡️ Demo Admin
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateWrongPassword}
                  className="w-full px-3 py-2 rounded-lg bg-red-50/50 hover:bg-red-50 border border-red-200/60 text-red-700 text-xs transition-colors font-medium flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>Simulasi Error: &ldquo;Email atau password salah.&rdquo;</span>
                </button>
              </div>
            </form>
          )}

          {/* ===================================================================== */}
          {/* CONDITIONAL RENDER: REGISTER FORM (FR-01)                             */}
          {/* ===================================================================== */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
              {/* Full Name & Phone Number (Clean Grid Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="register-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                  >
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <input
                      id="register-name"
                      type="text"
                      value={registerName}
                      onChange={(e) => {
                        setRegisterName(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="Contoh: Budi Santoso"
                      autoComplete="name"
                      required
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label
                    htmlFor="register-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                  >
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <input
                      id="register-phone"
                      type="tel"
                      value={registerPhone}
                      onChange={(e) => {
                        setRegisterPhone(e.target.value);
                        if (formError) setFormError(null);
                      }}
                      placeholder="081234567890"
                      autoComplete="tel"
                      required
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                    />
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => {
                      setRegisterEmail(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="nama@email.com"
                    autoComplete="email"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Password Field with Eye Toggle & Validation Hint (FR-01) */}
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="register-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => {
                      setRegisterPassword(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Buat password aman"
                    autoComplete="new-password"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800 p-1 rounded-md transition-colors"
                    aria-label={
                      showRegisterPassword ? 'Sembunyikan password' : 'Lihat password'
                    }
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Validation Indicator (FR-01: Minimal 8 karakter) */}
                <div className="mt-1.5 flex items-center justify-between">
                  <p
                    className={`text-xs transition-colors flex items-center gap-1.5 ${
                      registerPassword.length === 0
                        ? 'text-zinc-400'
                        : isPasswordValid
                        ? 'text-emerald-600 font-medium'
                        : 'text-amber-600'
                    }`}
                  >
                    {isPasswordValid ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
                    )}
                    <span>Minimal 8 karakter</span>
                  </p>

                  {registerPassword.length > 0 && (
                    <span className="text-[11px] text-zinc-400">
                      {registerPassword.length}/8
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Register Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-zinc-900 text-white w-full rounded-full py-4 mt-8 font-semibold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Buat Akun</span>
                )}
              </button>

              {/* Terms Agreement Text */}
              <p className="text-xs text-zinc-500 text-center mt-4 leading-relaxed">
                Dengan mendaftar, Anda menyetujui{' '}
                <a
                  href="#terms"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      'Syarat & Ketentuan ENSTEINSTORE:\n1. Transaksi eceran kain jas hujan dihitung dalam meter atau desimal (cth: 2.5m).\n2. Pembatalan pesanan hanya dapat dilakukan sebelum status pesanan diproses atau kain dipotong.'
                    );
                  }}
                  className="underline text-zinc-800 hover:text-zinc-950 font-medium"
                >
                  Syarat &amp; Ketentuan
                </a>{' '}
                kami.
              </p>
            </form>
          )}

          {/* Footer Assistance Info */}
          <div className="mt-12 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            <span>Butuh bantuan akun? Hubungi Admin WhatsApp di 0812-3456-7890</span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* FORGOT PASSWORD MODAL (LUXURIOUS MINIMALIST OVERLAY)                      */}
      {/* ========================================================================= */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Pemulihan Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSubmitted ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-zinc-900">Tautan Terkirim!</h4>
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Kami telah mengirimkan instruksi pemulihan kata sandi ke{' '}
                  <span className="font-medium text-zinc-800">{forgotEmail}</span>.
                  Silakan periksa kotak masuk atau folder spam Anda.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="mt-4 bg-zinc-900 text-white rounded-full py-3 px-6 text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Tutup &amp; Masuk
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (forgotEmail.trim()) {
                    setForgotSubmitted(true);
                  }
                }}
                className="mt-5 space-y-4"
              >
                <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                  Masukkan alamat email yang terdaftar di ENSTEINSTORE. Kami akan mengirimkan
                  tautan untuk mengatur ulang password Anda.
                </p>
                <div>
                  <label
                    htmlFor="forgot-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="w-1/2 py-3 rounded-full border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-3 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                  >
                    Kirim Instruksi
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
