import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../lib/format';

export default function ProtectedRoute() {
  const location = useLocation();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setHasSession(Boolean(data.session));
      setSessionReady(true);
    }

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setHasSession(Boolean(session));
      setSessionReady(true);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!sessionReady) return null;

  // Redirect to landing page (not /login) when unauthenticated
  if (!hasSession) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
