import React, { useId } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  id,
  name,
  type = 'text',
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  ...rest
}: InputProps): React.ReactElement {
  // React 18 useId — stable, SSR-safe unique id fallback
  const generatedId = useId();
  const inputId = id ?? name ?? generatedId;

  return (
    <div className={`${styles.field} ${className}`}>
      {label !== undefined && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' '}
              *
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        disabled={disabled}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error !== undefined
            ? `${inputId}-error`
            : hint !== undefined
            ? `${inputId}-hint`
            : undefined
        }
        className={`${styles.input} ${error !== undefined ? styles.inputError : ''}`}
        {...rest}
      />

      {error !== undefined && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}

      {hint !== undefined && error === undefined && (
        <span id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
}
