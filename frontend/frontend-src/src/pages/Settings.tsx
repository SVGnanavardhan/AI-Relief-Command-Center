import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
      <div className="mt-4 flex flex-col gap-4 text-sm text-slate-700">
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
          <span>Enable notifications</span>
          <input type="checkbox" checked={notifications} onChange={() => setNotifications((value) => !value)} />
        </label>
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
          <span>Remember me</span>
          <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((value) => !value)} />
        </label>
      </div>
    </div>
  );
}
