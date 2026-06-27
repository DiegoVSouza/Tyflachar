import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from 'store';
import { ProtectedRoute } from 'components/shared/ProtectedRoute';
import { ErrorBoundary } from 'components/shared/ErrorBoundary';
import { DashboardLayout } from 'components/layout/DashboardLayout';
import { LoginPage } from 'pages/LoginPage';
import { NotFoundPage } from 'pages/NotFoundPage';
import { InboxPage } from 'pages/InboxPage';
import { AppointmentsPage } from 'pages/AppointmentsPage';
import { ClientsPage } from 'pages/ClientsPage';
import { ClientPage } from 'pages/ClientPage';

function LoadingFallback(): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      Loading…
    </div>
  );
}

export default function App(): React.ReactElement {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/:clientSlug" element={<ClientPage page="landing" />} />
              <Route path="/:clientSlug/blog" element={<ClientPage page="blog" />} />
              <Route path="/:clientSlug/links" element={<ClientPage page="linktree" />} />

              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<DashboardLayout />}>
                  <Route
                    path="/dashboard"
                    element={<Navigate to="/dashboard/inbox" replace />}
                  />
                  <Route path="/dashboard/inbox" element={<InboxPage />} />
                  <Route path="/dashboard/appointments" element={<AppointmentsPage />} />
                  <Route path="/dashboard/clients" element={<ClientsPage />} />
                </Route>
              </Route>

              <Route path="/not-found" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
    </Provider>
  );
}
