import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  UserCheck,
  Lock,
  User as UserIcon,
  CheckCircle2,
  Key
} from 'lucide-react';

interface UserManagementProps {
  users: User[];
  onAddUser: (user: User) => boolean;
  onDeleteUser: (id: string | number) => void;
  currentUser: User | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  onAddUser,
  onDeleteUser,
  currentUser,
  showToast
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Staff');
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || !password) {
      showToast('Semua kolom pengguna wajib diisi!', 'error');
      return;
    }

    if (password.length < 5) {
      showToast('Password minimal 5 karakter!', 'warning');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password,
      role: role,
      createdAt: new Date().toISOString()
    };

    const success = onAddUser(newUser);
    if (success) {
      setName('');
      setUsername('');
      setPassword('');
      setRole('Staff');
    }
  };

  const handleConfirmDelete = () => {
    if (deletingUser) {
      onDeleteUser(deletingUser.id);
      setDeletingUser(null);
    }
  };

  return (
    <section id="menu-users" className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#e6f6ee] text-[#009B4C] rounded-2xl border border-[#a4e2c0] shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Pengguna Sistem
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Atur hak akses staf dan admin yang berwenang mengelola inventaris sekolah
            </p>
          </div>
        </div>

        <div className="bg-[#e6f6ee] text-[#009B4C] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm border border-[#a4e2c0] flex items-center gap-2">
          <span>Total:</span>
          <span id="total-users" className="text-base font-black">{users.length}</span>
          <span>Akun Pengguna</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Tambah Pengguna (Left Column) */}
        <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-7 h-fit">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
            <UserPlus className="w-5 h-5 text-[#009B4C]" />
            <h4 className="text-base font-bold text-slate-900">Tambah Akun Pengguna</h4>
          </div>

          <form id="form-add-user" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="user-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="user-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                  placeholder="Contoh: Budi Santoso, S.Kom"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-username" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Username Login
              </label>
              <div className="relative">
                <span className="text-xs font-mono font-bold text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                <input
                  type="text"
                  id="user-username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                  placeholder="nama_pengguna"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-password" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  id="user-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all"
                  placeholder="Minimal 5 karakter"
                />
              </div>
            </div>

            <div>
              <label htmlFor="user-role" className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-1.5">
                Hak Akses / Peran
              </label>
              <select
                id="user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#009B4C] outline-none transition-all font-medium"
              >
                <option value="Administrator">Administrator (Akses Penuh)</option>
                <option value="Staff">Staff / Operator Inventaris</option>
              </select>
            </div>

            <button
              type="submit"
              id="btn-submit-user"
              className="w-full mt-2 py-3 bg-gradient-to-r from-[#009B4C] to-[#007A3B] hover:from-[#008742] hover:to-[#006631] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#009B4C]/20 hover:shadow-[#009B4C]/35 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Pengguna Baru</span>
            </button>
          </form>
        </div>

        {/* Tabel Daftar Pengguna (Right Column) */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden flex flex-col">
          <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#009B4C]" />
              <span>Daftar Akun Terdaftar</span>
            </h4>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-white text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-5 font-bold">No</th>
                  <th className="py-3.5 px-5 font-bold">Profil Pengguna</th>
                  <th className="py-3.5 px-5 font-bold">Hak Akses</th>
                  <th className="py-3.5 px-5 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody id="users-tbody" className="divide-y divide-slate-100">
                {users.map((u, index) => {
                  const isDefaultAdmin = u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'ahmadfirmansyah';
                  const isSelf = currentUser?.id === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-[#e6f6ee]/40 transition-colors group">
                      <td className="py-4 px-5 text-slate-400 font-bold">{index + 1}</td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#009B4C] to-[#006631] text-white flex items-center justify-center text-sm font-black shadow-xs flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">
                              {u.name}
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] text-[#009B4C] bg-[#e6f6ee] px-2 py-0.2 rounded-md font-bold">
                                  (Anda)
                                </span>
                              )}
                            </p>
                            <p className="font-mono text-xs text-slate-400 mt-0.5">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${
                            u.role === 'Administrator'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {u.role === 'Administrator' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        {isDefaultAdmin ? (
                          <span className="text-[11px] text-slate-400 font-semibold px-2.5 py-1 bg-slate-100 rounded-lg">
                            Admin Utama
                          </span>
                        ) : (
                          <button
                            type="button"
                            id={`btn-delete-user-${u.id}`}
                            onClick={() => setDeletingUser(u)}
                            className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer"
                            title="Hapus Akun Pengguna"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Hapus Akun Pengguna?</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
              Pengguna <strong>{deletingUser.name}</strong> (@{deletingUser.username}) tidak akan dapat login lagi ke sistem.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/25 transition-all"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
