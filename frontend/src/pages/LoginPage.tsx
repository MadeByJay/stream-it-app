import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error('Login failed', error);
      setErrorMessage('Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <h2>Sign In</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {errorMessage && <div className="auth-error">{errorMessage}</div>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="auth-switch">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
