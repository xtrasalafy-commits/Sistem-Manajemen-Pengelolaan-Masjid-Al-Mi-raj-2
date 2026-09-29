import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User as UserIcon, Mail, Phone, MapPin, KeyRound, Save } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/ui/FormInput';
import FormTextarea from '../../components/ui/FormTextarea';

import useAuthStore from '../../store/authStore';
import { authApi } from '../../services/endpoints';
import { ROLE_LABEL, ROLE_BADGE } from '../../utils/constants';
import { inisial } from '../../utils/format';

const profileSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  telepon: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9+\-\s]{8,20}$/.test(v), 'Nomor telepon tidak valid'),
  alamat: z.string().optional(),
});

const passwordSchema = z
  .object({
    passwordLama: z.string().min(1, 'Password lama wajib diisi'),
    passwordBaru: z
      .string()
      .min(8, 'Min 8 karakter')
      .contains(/[a-z]/, 'Harus ada huruf kecil')
      .contains(/[A-Z]/, 'Harus ada huruf besar')
      .contains(/[0-9]/, 'Harus ada angka'),
    konfirmasiPassword: z.string().min(1, 'Konfirmasi wajib diisi'),
  })
  .refine((d) => d.passwordBaru === d.konfirmasiPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['konfirmasiPassword'],
  });

const ProfilPage = () => {
  const { user, setUser } = useAuthStore();

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: savingProfile },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nama: user?.nama || '',
      telepon: user?.telepon || '',
      alamat: user?.alamat || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: savingPassword },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      setUser(res.data.user);
      resetProfile(res.data.user);
      toast.success('Profil berhasil diperbarui');
    } catch (err) {
      console.error(err);
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await authApi.changePassword({
        passwordLama: data.passwordLama,
        passwordBaru: data.passwordBaru,
      });
      resetPassword();
      toast.success('Password berhasil diubah');
    } catch (err) {
      // error 400 (password lama salah) ditangani interceptor
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Profil Saya" subtitle="Kelola informasi akun & keamanan" icon={UserIcon} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kartu profil */}
        <Card className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-800 text-3xl font-bold text-white shadow-lg">
            {inisial(user?.nama)}
          </div>
          <h3 className="mt-4 text-lg font-bold text-dark-900">{user?.nama}</h3>
          <p className="text-sm text-dark-500">{user?.email}</p>
          <div className="mt-3">
            <span className={ROLE_BADGE[user?.role]}>{ROLE_LABEL[user?.role]}</span>
          </div>

          <div className="mt-6 w-full space-y-3 border-t border-dark-100 pt-4 text-left">
            <div className="flex items-center gap-2.5 text-sm text-dark-600">
              <Mail className="h-4 w-4 flex-shrink-0 text-dark-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-dark-600">
              <Phone className="h-4 w-4 flex-shrink-0 text-dark-400" />
              <span>{user?.telepon || 'Belum diisi'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-dark-600">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-dark-400" />
              <span>{user?.alamat || 'Belum diisi'}</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {/* Edit profil */}
          <Card title="Informasi Pribadi">
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4" noValidate>
              <FormInput
                label="Nama Lengkap"
                icon={UserIcon}
                error={profileErrors.nama}
                {...registerProfile('nama')}
              />
              <FormInput
                label="Email"
                type="email"
                value={user?.email}
                disabled
                hint="Email tidak dapat diubah. Hubungi administrator jika perlu."
              />
              <FormInput
                label="Nomor Telepon"
                type="tel"
                placeholder="0812xxxxxxxx"
                icon={Phone}
                error={profileErrors.telepon}
                {...registerProfile('telepon')}
              />
              <FormTextarea label="Alamat" rows={3} error={profileErrors.alamat} {...registerProfile('alamat')} />

              <div className="flex justify-end">
                <Button type="submit" icon={Save} loading={savingProfile}>
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </Card>

          {/* Ubah password */}
          <Card title="Keamanan" subtitle="Ubah password secara berkala untuk menjaga keamanan akun">
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
              <FormInput
                label="Password Lama"
                type="password"
                icon={KeyRound}
                error={passwordErrors.passwordLama}
                {...registerPassword('passwordLama')}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormInput
                  label="Password Baru"
                  type="password"
                  icon={KeyRound}
                  error={passwordErrors.passwordBaru}
                  hint="Min 8 karakter: huruf besar, kecil & angka"
                  {...registerPassword('passwordBaru')}
                />
                <FormInput
                  label="Konfirmasi Password"
                  type="password"
                  icon={KeyRound}
                  error={passwordErrors.konfirmasiPassword}
                  {...registerPassword('konfirmasiPassword')}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" icon={KeyRound} loading={savingPassword}>
                  Ubah Password
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilPage;
