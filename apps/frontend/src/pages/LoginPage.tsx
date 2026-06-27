import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'hooks/useAuth';
import { Button } from 'components/ui/Button';
import { Input } from 'components/ui/Input';
import styles from './LoginPage.module.css';

interface FormState {
  email: string;
  password: string;
}

type FieldErrors = Partial<Record<keyof FormState, string>>;

export function LoginPage(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuth();

  const [form, setForm] = useState<FormState>({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!form.email.trim()) errors.email = 'E-mail é obrigatório.';
    if (!form.password) errors.password = 'Senha é obrigatória.';
    return errors;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const success = await login(form);
    if (success) {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          {process.env['REACT_APP_NAME'] ?? 'GSD App'}
        </div>
        <h1 className={styles.title}>Entrar na sua conta</h1>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className={styles.form}>
          {error !== null && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <Input
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={fieldErrors.email}
            placeholder="seu@email.com"
            required
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={fieldErrors.password}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
