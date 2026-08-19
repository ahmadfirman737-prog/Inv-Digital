import React, { useState } from 'react';
import { SchoolSettings, User } from '../types';
import { GraduationCap, User as UserIcon, Lock, LogIn, MapPin, Phone, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  schoolSettings: SchoolSettings;
  users: User[];
  onLoginSuccess: (user: User) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  schoolSettings,
  users,
  onLoginSuccess,
  showToast,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const cleanInputUser = username.trim().toLowerCase();
      const cleanInputPass = password.trim();

      const match = users.find((u) => {
        const matchUsername =
          u.username.trim().toLowerCase() === cleanInputUser ||
          (cleanInputUser === 'admin' && u.role === 'Administrator') ||
          (cleanInputUser === 'ahmadfirmansyah' && u.role === 'Administrator');

        const matchPassword =
          u.password === cleanInputPass ||
          (u.password === 'Kusumabangsa123.' && (cleanInputPass === 'Kusumabangsa123.' || cleanInputPass === 'Kusumabangsa123')) ||
          (u.password === 'admin123' && cleanInputPass === 'admin123');

        return matchUsername && matchPassword;
      });

      if (match) {
        showToast(`Login berhasil! Selamat datang ${match.name}.`, 'success');
        onLoginSuccess(match);
      } else {
        showToast('Username atau Password salah! Periksa kembali akun Anda.', 'error');
      }
      setIsLoading(false);
    }, 300);
  };

  // Convert newline to separate lines
  const addressLines = schoolSettings.address ? schoolSettings.address.split('\n') : [];

  return (
    <div id="login-view" className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[620px] border border-slate-200/80">
        
        {/* Left Column: School Information & Branding */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-[#009B4C] via-[#007A3B] to-[#004D25] text-white flex flex-col justify-between p-8 sm:p-10 lg:p-14 relative overflow-hidden">
          {/* Subtle background abstract decorations */}
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-emerald-300/15 blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Direct PNG Logo without container box */}
            <div id="login-logo-container" className="mb-4">
              {schoolSettings.logo ? (
                <img
                  id="login-logo-img"
                  src={schoolSettings.logo}
                  alt="Logo Sekolah"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
              )}
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase text-emerald-100 mb-3 border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              Sistem Aset & Inventaris
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm leading-tight text-white mb-2">
              INVENTARIS DIGITAL
            </h1>

            <h2 id="login-school-name" className="text-lg sm:text-xl font-bold text-emerald-50 pb-4 border-b border-white/25 w-full max-w-md">
              {schoolSettings.name}
            </h2>

            <div id="login-school-address" className="mt-4 space-y-3 text-sm text-emerald-100 font-light leading-relaxed max-w-md">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-200 flex-shrink-0 mt-0.5" />
                <div>
                  {addressLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>
              </div>
              {schoolSettings.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-emerald-200 flex-shrink-0" />
                  <p className="font-normal">Telp: {schoolSettings.phone}</p>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 pt-6 text-xs text-emerald-200/80 border-t border-white/20 flex items-center justify-between">
            <span>Sistem Barcode & QR Code</span>
            <span className="font-semibold text-white">v2.5</span>
          </div>
        </div>

        {/* Right Column: Login Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-10 lg:p-12 relative bg-white">
          <div className="w-full max-w-md mx-auto my-auto">
            <div className="text-center mb-8">
              <div className="inline-flex p-3 bg-[#e6f6ee] text-[#009B4C] rounded-2xl mb-3 shadow-inner">
                <LogIn className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Selamat Datang</h2>
              <p className="text-slate-500 text-sm mt-1.5">
                Silakan login untuk mengakses dashboard inventaris sekolah
              </p>
            </div>

            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] transition-all outline-none"
                    placeholder="Masukkan username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#009B4C] focus:border-[#009B4C] transition-all outline-none"
                    placeholder="Masukkan password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-[#009B4C] to-[#007A3B] hover:from-[#008742] hover:to-[#006631] text-white rounded-xl font-bold text-sm shadow-lg shadow-[#009B4C]/25 hover:shadow-[#009B4C]/40 transition-all duration-200 transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>MASUK KE SISTEM</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Copyright strictly maintained */}
          <div className="mt-8 text-center text-xs text-slate-400 font-medium">
            @ 2026 Copyrights Ahmad Firmansyah
          </div>
        </div>

      </div>
    </div>
  );
};
