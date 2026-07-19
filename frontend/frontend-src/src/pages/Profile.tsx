import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setProfile(response.data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Profile</h2>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <div><span className="font-medium">Name:</span> {profile.name}</div>
        <div><span className="font-medium">Email:</span> {profile.email}</div>
        <div><span className="font-medium">Role:</span> {profile.role}</div>
        <div><span className="font-medium">Phone:</span> {profile.phone || '—'}</div>
      </div>
    </div>
  );
}
