import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import cn from '../../utils/cn';

/**
 * Search input dengan debounce (default 400ms).
 */
const SearchInput = ({ value = '', onChange, placeholder = 'Cari...', debounceMs = 400, className = '', ...props }) => {
  const [localValue, setLocalValue] = useState(value);

  // Sinkronisasi nilai dari parent (mis. saat reset filter)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localValue, debounceMs]);

  return (
    <div className={cn('relative w-full', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" aria-hidden />
      <input
        type="search"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-10 pr-9"
        aria-label={placeholder}
        {...props}
      />
      {localValue && (
        <button
          type="button"
          onClick={() => {
            setLocalValue('');
            onChange('');
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-700"
          aria-label="Hapus pencarian"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
