import { forwardRef } from 'react';
import cn from '../../utils/cn';

/** Textarea dengan auto-resize opsional */
const FormTextarea = forwardRef(({ label, name, error = null, hint = null, rows = 4, className = '', containerClassName = '', ...props }, ref) => {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {props.required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={name}
        name={name}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={cn('form-input resize-y', error && 'form-input-error', className)}
        {...props}
      />
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

FormTextarea.displayName = 'FormTextarea';
export default FormTextarea;
