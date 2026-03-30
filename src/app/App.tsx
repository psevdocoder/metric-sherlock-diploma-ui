import { Navigate, HashRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthProvider';
import { useAuth } from '../auth/useAuth';
import { AppShell } from '../components/AppShell';
import { ErrorBlock, LoadingBlock } from '../components/PageState';
import { RequireRole } from '../components/RequireRole';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { LimitsPage } from '../pages/LimitsPage';
import { MetricWhitelistPage } from '../pages/MetricWhitelistPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ReportDetailsPage } from '../pages/ReportDetailsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SchedulePage } from '../pages/SchedulePage';
import { TargetWhitelistPage } from '../pages/TargetWhitelistPage';

function AppRoutes() {
  const auth = useAuth();
  const canViewReports = auth.roles.includes('admin') || auth.roles.includes('user');

  if (auth.status === 'loading') {
    return (
      <section className="state-page">
        <LoadingBlock description="Инициализируем Keycloak, получаем токен и роли пользователя." />
      </section>
    );
  }

  if (auth.status === 'error') {
    return (
      <section className="state-page">
        <ErrorBlock message={auth.error || 'SSO инициализация завершилась ошибкой'} onRetry={() => window.location.reload()} />
      </section>
    );
  }

  if (!canViewReports) {
    return (
      <section className="state-page">
        <ForbiddenPage />
      </section>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />} path="/">
          <Route element={<Navigate replace to="/reports" />} index />
          <Route element={<ReportsPage />} path="reports" />
          <Route element={<ReportDetailsPage />} path="reports/:id" />

          <Route element={<RequireRole allowed_roles={['admin']} />}>
            <Route element={<MetricWhitelistPage />} path="whitelist/metrics" />
            <Route element={<TargetWhitelistPage />} path="whitelist/targets" />
            <Route element={<LimitsPage />} path="settings/limits" />
            <Route element={<SchedulePage />} path="settings/schedule" />
          </Route>

          <Route element={<NotFoundPage />} path="*" />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
