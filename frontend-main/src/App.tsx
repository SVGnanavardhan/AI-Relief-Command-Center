import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { LoadingState } from './components/StatusPill';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const SubmitReport = lazy(() => import('./pages/SubmitReport'));
const IncidentDetails = lazy(() => import('./pages/IncidentDetails'));
const PriorityQueue = lazy(() => import('./pages/PriorityQueue'));
const InteractiveMap = lazy(() => import('./pages/InteractiveMap'));
const Operations = lazy(() => import('./pages/Operations'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
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
