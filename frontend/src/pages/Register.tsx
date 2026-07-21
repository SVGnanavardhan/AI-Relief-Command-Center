import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { supabase } from '../lib/format';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginAction, setShowLoginAction] = useState(false);
  const submitLockedRef = useRef(false);
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (isMounted && data.session) {
        navigate('/dashboard');
      }
    }

    checkSession();

    return () => {
      isMounted = false;
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [navigate]);

  function isRateLimitError(error: { status?: number; message?: string; code?: string } | null | undefined) {
    const message = (error?.message || '').toLowerCase();
    return error?.status === 429 || error?.code === 'over_email_send_rate_limit' || message.includes('over_email_send_rate_limit') || message.includes('rate limit') || message.includes('too many verification emails');
  }

  function isExistingUserError(error: { message?: string } | null | undefined) {
    const message = (error?.message || '').toLowerCase();
    return message.includes('already registered') || message.includes('already exists') || message.includes('user already') || message.includes('already in use');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (submitLockedRef.current) {
      console.info('[Register] Ignored duplicate submit while request is already in progress.');
      return;
    }

    submitLockedRef.current = true;
    setError('');
    setSuccessMessage('');
    setShowLoginAction(false);
    setIsSubmitting(true);

    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    console.info('[Register] Signup request started', { email: normalizedEmail, role });

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            full_name: normalizedName,
            role,
          },
        },
      });

      console.info('[Register] Supabase signup response received', {
        hasSession: Boolean(data.session),
        hasUser: Boolean(data.user),
        error: signUpError,
      });

      if (signUpError) {
        if (isRateLimitError(signUpError)) {
          setError('Too many verification emails have been sent. Please wait a few minutes before trying again.');
          return;
        }

        if (isExistingUserError(signUpError)) {
          setError('An account with this email already exists.');
          setShowLoginAction(true);
          return;
        }

        throw new Error(signUpError.message || 'Unable to register');
      }

      if (data.session?.access_token) {
        console.info('[Register] Session returned; signing in and redirecting to dashboard.');
        const response = await api.post('/auth/register', {
          access_token: data.session.access_token,
          name: normalizedName,
          email: normalizedEmail,
          role,
        });

        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token ?? '');
        localStorage.setItem('auth_user', JSON.stringify(response.data.user));
        navigate('/dashboard');
        return;
      }

      if (data.user) {
        console.info('[Register] No session returned; email confirmation is likely required.');
        const confirmationMessage = 'Registration successful. Please verify your email before signing in.';
        setSuccessMessage(confirmationMessage);
        setShowLoginAction(true);
        redirectTimerRef.current = window.setTimeout(() => navigate('/login'), 2500);
        return;
      }

      throw new Error('Registration did not create a user. Please try again.');
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.detail || 'Unable to register';
      console.error('[Register] Signup failed', err);
      setError(message);
    } finally {
      submitLockedRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Create account</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Register for the response network</h2>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input className="rounded-xl border border-slate-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input className="rounded-xl border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <select className="rounded-xl border border-slate-300 px-3 py-2" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="citizen">Citizen</option>
          <option value="rescue_team">Rescue Team</option>
          <option value="operations_officer">Operations Officer</option>
          <option value="administrator">Administrator</option>
        </select>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white" />
              Creating account…
            </span>
          ) : (
            'Register'
          )}
        </button>
        {showLoginAction ? (
          <button type="button" className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        ) : null}
      </form>
    </div>
  );
}
