import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import useAuthStore from '../../store/authStore';
import { authApi } from '../../services/endpoints';

const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    try {
      const res = await authApi.login(data);
      setAuth({ user: res.data.user, accessToken: res.data.accessToken });
      toast.success(`Selamat datang, ${res.data.user.nama.split(' ')[0]}!`);
      const redirectTo = location.state?.from || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      // Error toast sudah ditangani interceptor axios
      console.error('Login error:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-4">
      {/* Pattern dekoratif */}
      <div className="pointer-events-none absolute inset-0 bg-pattern-islamic opacity-30" aria-hidden />

      <div className="relative w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="currentColor" aria-hidden>
              <path d="M12 2c1.2 2.6 3.7 4.3 6.5 4.3-.2 3.5-1.8 6.5-4.4 8.3h4.1v3.3H5.8v-3.3h4.1C7.3 12.8 5.7 9.8 5.5 6.3 8.3 6.3 10.8 4.6 12 2zm-6 16.4h12v1.7H6v-1.7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Masjid Al-Mi'raj</h1>
          <p className="mt-1 text-sm text-primary-100">Sistem Manajemen Pengelolaan Masjid</p>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-dark-900">Masuk</h2>
            <p className="mt-1 text-sm text-dark-500">Silakan masuk untuk melanjutkan ke dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormInput
              label="Email"
              type="email"
              placeholder="nama@email.com"
              icon={Mail}
              autoComplete="email"
              autoFocus
              error={errors.email}
              {...register('email')}
            />

            <div>
              <FormInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                autoComplete="current-password"
                error={errors.password}
                {...register('password')}
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

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting} icon={LogIn}>
              {isSubmitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-dark-500">
            Belum punya akun?{' '}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Daftar di sini
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

export default LoginPage;
