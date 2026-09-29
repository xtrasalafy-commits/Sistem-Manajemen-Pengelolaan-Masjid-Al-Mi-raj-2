/**
 * Helper format: tanggal, rupiah, angka, dll.
 */
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

/** Format tanggal Indonesia: 1 Januari 2025 */
export const formatTanggal = (date, formatStr = 'dd MMMM yyyy') => {
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (!isValid(parsed)) return '-';
  return format(parsed, formatStr, { locale: idLocale });
};

/** Format tanggal + waktu: 1 Jan 2025, 14.30 */
export const formatTanggalWaktu = (date) => formatTanggal(date, 'dd MMM yyyy, HH.mm');

/** Format waktu saja: 14:30 */
export const formatWaktu = (date) => {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (!isValid(parsed)) return '-';
  return format(parsed, 'HH:mm');
};

/** Relatif: "2 jam yang lalu" */
export const formatRelatif = (date) => {
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (!isValid(parsed)) return '-';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: idLocale });
};

/** Format Rupiah: Rp 1.500.000 */
export const formatRupiah = (angka, withSymbol = true) => {
  const num = Number(angka) || 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return withSymbol ? formatted : formatted.replace(/^Rp\s?/, '');
};

/** Format angka biasa: 1.500.000 */
export const formatAngka = (angka) => new Intl.NumberFormat('id-ID').format(Number(angka) || 0);

/** Persentase */
export const formatPersen = (nilai, total, desimal = 1) => {
  if (!total) return '0%';
  return `${((Number(nilai) / total) * 100).toFixed(desimal)}%`;
};

/** Inisial nama untuk avatar */
export const inisial = (nama) => {
  if (!nama) return '?';
  return nama
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
};

/** Potong teks panjang */
export const potong = (teks, panjang = 100) => {
  if (!teks) return '';
  return teks.length > panjang ? `${teks.slice(0, panjang)}...` : teks;
};

/** Konversi size bytes ke KB/MB */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/** Validasi email sederhana */
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/** Debounce untuk search input */
export const debounce = (fn, delay = 400) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};
