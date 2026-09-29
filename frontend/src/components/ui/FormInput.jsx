import { forwardRef } from 'react';
import cn from '../../utils/cn';

/**
 * Input text/number/date/email reusable.
 * Bekerja dengan react-hook-form (register) atau controlled (value/onChange).
 */
const FormInput = forwardRef(({ label, name, error = null, hint = null, className = '', containerClassName = '', icon: Icon = null, ...props }, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {props.required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark-400" aria-hidden />
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={cn('form-input', Icon && 'pl-10', error && 'form-input-error', className)}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${name}-error`} className="form-error">
          {typeof error === 'string' ? error : error.message}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="form-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

FormInput.displayName = 'FormInput';
export default FormInput;
