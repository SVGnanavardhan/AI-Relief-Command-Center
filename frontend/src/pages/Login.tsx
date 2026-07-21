import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { supabase } from '../lib/format';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate('/dashboard');
      }
    }
    checkSession();
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const details = signInError.message || 'Unable to sign in';
        throw new Error(details);
      }

      if (!data.session?.access_token) {
        throw new Error('No Supabase session was returned. Please try again.');
      }

      const response = await api.post('/auth/login', {
        access_token: data.session.access_token,
      });

      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token ?? '');
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      navigate('/dashboard');
    } catch (err: any) {
      const message = err?.message || err?.response?.data?.detail || 'Unable to sign in';
      setError(message);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Authentication</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Sign in to the command center</h2>
      </div>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input className="rounded-xl border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input className="rounded-xl border border-slate-300 px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white" type="submit">Login</button>
      </form>
      <p className="text-sm text-slate-600">Need an account? Use the register flow from the API or create a user in the backend.</p>
    </div>
  );
}
