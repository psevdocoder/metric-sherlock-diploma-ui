import { Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { ForbiddenPage } from '../pages/ForbiddenPage';

interface RequireRoleProps {
  allowed_roles: string[];
}

export function RequireRole({ allowed_roles }: RequireRoleProps) {
  const auth = useAuth();
  const hasAccess = auth.roles.some((role) => allowed_roles.includes(role));

  if (!hasAccess) {
    return <ForbiddenPage />;
  }

  return <Outlet />;
}
