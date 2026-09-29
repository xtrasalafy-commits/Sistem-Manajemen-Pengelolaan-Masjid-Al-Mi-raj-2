import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import cn from '../../utils/cn';

const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  gold: 'btn-gold',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

const SIZES = {
  sm: 'btn-sm',
  md: '',
  lg: 'px-5 py-3 text-base',
  icon: 'p-2',
};

/**
 * Button reusable dengan variant, ukuran, loading & icon.
 */
const Button = forwardRef(
  ({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', icon: Icon = null, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(VARIANTS[variant], SIZES[size], className)}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
