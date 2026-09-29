import { forwardRef } from 'react';
import cn from '../../utils/cn';

/**
 * Select dropdown. `options`: [{ value, label }] atau array of string.
 */
const FormSelect = forwardRef(
  ({ label, name, error = null, hint = null, options = [], placeholder = '-- Pilih --', className = '', containerClassName = '', children, ...props }, ref) => {
    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={name} className="form-label">
            {label}
            {props.required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
          className={cn('form-input cursor-pointer', error && 'form-input-error', className)}
          {...props}
        >
          <option value="">{placeholder}</option>
          {children
            ? children
            : options.map((opt) => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const labelTxt = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={value} value={value}>
                    {labelTxt}
                  </option>
                );
              })}
        </select>
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
  }
);

FormSelect.displayName = 'FormSelect';
export default FormSelect;
