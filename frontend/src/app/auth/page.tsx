'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { ApiException } from '../../lib/api';
import {
  Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2,
  Lock, Mail, User, Phone, ShieldCheck, Sparkles, Check, X, HelpCircle,
} from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  const isPasswordValid = registerPassword.length >= 8;

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
      const res = await login({ email: loginEmail, password: loginPassword });
      // res is void (login sets user in context)
      const user = JSON.parse(localStorage.getItem('ensteinstore_user') || '{}');
      setSuccessMessage(
        user.role === 'ADMIN'
          ? 'Login Admin berhasil! Mengalihkan ke dashboard...'
          : 'Login berhasil! Selamat datang kembali di ENSTEINSTORE.'
      );
      setTimeout(() => {
        router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/');
      }, 1000);
    } catch (err) {
      if (err instanceof ApiException) {
        if (err.fieldErrors?.length) {
          setFieldErrors(err.fieldErrors);
        } else {
          setFormError(err.message || 'Email atau password salah.');
        }
      } else {
        setFormError('Terjadi kesalahan. Silakan coba lagi.');
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

    if (!registerName.trim()) { setFormError('Nama lengkap wajib diisi.'); return; }
    if (!registerPhone.trim()) { setFormError('Nomor telepon aktif wajib diisi.'); return; }
    if (!registerEmail.trim() || !registerEmail.includes('@')) { setFormError('Format email tidak valid.'); return; }
    if (registerPassword.length < 8) { setFormError('Password harus minimal 8 karakter.'); return; }

    setIsLoading(true);
    try {
      await register({
        fullName: registerName,
        phone: registerPhone,
        email: registerEmail,
        password: registerPassword,
      });
      setSuccessMessage('Akun berhasil didaftarkan! Silakan login.');
      setTimeout(() => setActiveTab('login'), 1500);
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
    <main className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:text-zinc-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Toko
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-zinc-900">ENSTEINSTORE</span>
          </div>
        </div>
      </header>

      <section className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-xs font-semibold text-amber-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              ENSTEINSTORE Member
            </div>
            <h1 className="text-3xl font-bold text-zinc-900">
              {activeTab === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
            </h1>
            <p className="text-sm text-zinc-500 mt-2">
              {activeTab === 'login'
                ? 'Masuk ke akun Anda untuk melanjutkan belanja.'
                : 'Daftarkan diri untuk menikmati layanan ENSTEINSTORE.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-zinc-100 rounded-2xl p-1 mb-8">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setFormError(null); setFieldErrors([]); setSuccessMessage(null); }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === tab
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {tab === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {formError && (
            <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{formError}</p>
            </div>
          )}
          {fieldErrors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-5 space-y-1">
              {fieldErrors.map((fe, i) => (
                <p key={i} className="text-sm text-rose-700">• {fe.message}</p>
              ))}
            </div>
          )}
          {successMessage && (
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">{successMessage}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  'Masuk ke Akun'
                )}
              </button>

              <p className="text-center text-xs text-zinc-500">
                Belum punya akun?{' '}
                <button type="button" onClick={() => setActiveTab('register')} className="font-semibold text-zinc-900 underline underline-offset-2">
                  Daftar sekarang
                </button>
              </p>
            </form>
          )}

          {/* Register Form */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <div>
                <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="reg-name"
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-phone" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Nomor Telepon
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="reg-phone"
                    type="tel"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="reg-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    id="reg-password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-zinc-200 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
                  >
                    {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {isPasswordValid
                    ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                    : <X className="w-3.5 h-3.5 text-rose-400" />}
                  <span className={`text-xs ${isPasswordValid ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    Minimal 8 karakter
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  'Buat Akun'
                )}
              </button>

              <p className="text-center text-xs text-zinc-500">
                Sudah punya akun?{' '}
                <button type="button" onClick={() => setActiveTab('login')} className="font-semibold text-zinc-900 underline underline-offset-2">
                  Masuk di sini
                </button>
              </p>
            </form>
          )}

          {/* Help footer */}
          <div className="mt-10 pt-6 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Butuh bantuan akun? Hubungi Admin via WhatsApp +62 838 7694 2484</span>
          </div>
        </div>
      </section>
    </main>
  );
}
