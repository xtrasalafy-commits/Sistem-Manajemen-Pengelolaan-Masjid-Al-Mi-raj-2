import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Phone } from 'lucide-react';

import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../services/endpoints';

const registerSchema = z
  .object({
    nama: z.string().min(3, 'Nama minimal 3 karakter').max(255, 'Nama maksimal 255 karakter'),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    telepon: z
      .string()
      .optional()
      .refine((v) => !v || /^[0-9+\-\s]{8,20}$/.test(v), 'Nomor telepon tidak valid'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .contains(/[a-z]/, 'Harus ada huruf kecil')
      .contains(/[A-Z]/, 'Harus ada huruf besar')
      .contains(/[0-9]/, 'Harus ada angka'),
    konfirmasiPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.konfirmasiPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasiPassword'],
  });

const RegisterPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { nama: '', email: '', telepon: '', password: '', konfirmasiPassword: '' },
  });

  const onSubmit = async (data) => {
    try {
      const { konfirmasiPassword, ...payload } = data;
      const res = await authApi.register(payload);
      setAuth({ user: res.data.user, accessToken: res.data.accessToken });
      toast.success('Registrasi berhasil! Selamat datang.');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-4">
      <div className="pointer-events-none absolute inset-0 bg-pattern-islamic opacity-30" aria-hidden />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="currentColor" aria-hidden>
              <path d="M12 2c1.2 2.6 3.7 4.3 6.5 4.3-.2 3.5-1.8 6.5-4.4 8.3h4.1v3.3H5.8v-3.3h4.1C7.3 12.8 5.7 9.8 5.5 6.3 8.3 6.3 10.8 4.6 12 2zm-6 16.4h12v1.7H6v-1.7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Masjid Al-Mi'raj</h1>
          <p className="mt-1 text-sm text-primary-100">Daftar akun jamaah baru</p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-dark-900">Registrasi</h2>
            <p className="mt-1 text-sm text-dark-500">Lengkapi data untuk membuat akun jamaah</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormInput
              label="Nama Lengkap"
              placeholder="Ahmad Fauzi"
              icon={User}
              autoComplete="name"
              autoFocus
              error={errors.nama}
              {...register('nama')}
            />

            <FormInput
              label="Email"
              type="email"
              placeholder="nama@email.com"
              icon={Mail}
              autoComplete="email"
              error={errors.email}
              {...register('email')}
            />

            <FormInput
              label="Nomor Telepon"
              type="tel"
              placeholder="0812xxxxxxxx"
              icon={Phone}
              autoComplete="tel"
              error={errors.telepon}
              hint="Opsional. Format: 0812xxx / +62xxx"
              {...register('telepon')}
            />

            <FormInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              autoComplete="new-password"
              error={errors.password}
              hint="Minimal 8 karakter: huruf besar, huruf kecil & angka"
              {...register('password')}
            />

            <div>
              <FormInput
                label="Konfirmasi Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                autoComplete="new-password"
                error={errors.konfirmasiPassword}
                {...register('konfirmasiPassword')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPassword ? 'Sembunyikan' : 'Tampilkan'} password
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting} icon={UserPlus}>
              {isSubmitting ? 'Memproses...' : 'Daftar Sekarang'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-500">
            Sudah punya akun?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              Masuk di sini
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-primary-100">
          &copy; {new Date().getFullYear()} Masjid Al-Mi'raj. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
