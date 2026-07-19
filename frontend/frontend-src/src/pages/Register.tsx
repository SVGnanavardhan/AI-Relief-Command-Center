import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('citizen');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      navigate('/');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to register');
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
        <button className="rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white" type="submit">Register</button>
      </form>
    </div>
  );
}
