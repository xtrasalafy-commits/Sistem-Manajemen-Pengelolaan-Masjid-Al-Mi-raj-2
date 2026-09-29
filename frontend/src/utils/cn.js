/**
 * className merge helper (sederhana, tanpa dependensi clsx/tailwind-merge).
 * Menerima string/array/object & menghasilkan string className.
 */
export const cn = (...inputs) =>
  inputs
    .flat(Infinity)
    .filter((v) => {
      if (!v) return false;
      if (typeof v === 'string' || typeof v === 'number') return true;
      if (typeof v === 'object') {
        return Object.entries(v).some(([, val]) => Boolean(val));
      }
      return false;
    })
    .map((v) => {
      if (typeof v === 'object') {
        return Object.entries(v)
          .filter(([, val]) => Boolean(val))
          .map(([key]) => key)
          .join(' ');
      }
      return String(v);
    })
    .join(' ');

export default cn;
