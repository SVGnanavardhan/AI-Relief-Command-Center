import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingState } from './components/StatusPill';

const LandingPage    = lazy(() => import('./pages/LandingPage'));
const Dashboard      = lazy(() => import('./pages/Dashboard'));
const SubmitReport   = lazy(() => import('./pages/SubmitReport'));
const IncidentDetails = lazy(() => import('./pages/IncidentDetails'));
const PriorityQueue  = lazy(() => import('./pages/PriorityQueue'));
const InteractiveMap = lazy(() => import('./pages/InteractiveMap'));
const Operations     = lazy(() => import('./pages/Operations'));
const Profile        = lazy(() => import('./pages/Profile'));
const Settings       = lazy(() => import('./pages/Settings'));
const NotFound       = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing / auth page — no sidebar */}
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingState label="Loading…" />}>
              <LandingPage />
            </Suspense>
          }
        />

        {/* App shell with sidebar */}
        <Route element={<Layout />}>
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <Suspense fallback={<LoadingState label="Loading dashboard…" />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/submit"
              element={
                <Suspense fallback={<LoadingState label="Loading…" />}>
                  <SubmitReport />
                </Suspense>
              }
            />
            <Route
              path="/queue"
              element={
                <Suspense fallback={<LoadingState label="Loading queue…" />}>
                  <PriorityQueue />
                </Suspense>
              }
            />
            <Route
              path="/map"
              element={
                <Suspense fallback={<LoadingState label="Loading map…" />}>
                  <InteractiveMap />
                </Suspense>
              }
            />
            <Route
              path="/operations"
              element={
                <Suspense fallback={<LoadingState label="Loading operations…" />}>
                  <Operations />
                </Suspense>
              }
            />
            <Route
              path="/incident/:id"
              element={
                <Suspense fallback={<LoadingState label="Loading incident…" />}>
                  <IncidentDetails />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<LoadingState label="Loading profile…" />}>
                  <Profile />
                </Suspense>
              }
            />
            <Route
              path="/settings"
              element={
                <Suspense fallback={<LoadingState label="Loading settings…" />}>
                  <Settings />
                </Suspense>
              }
            />
          </Route>

          <Route
            path="*"
            element={
              <Suspense fallback={<LoadingState />}>
                <NotFound />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
