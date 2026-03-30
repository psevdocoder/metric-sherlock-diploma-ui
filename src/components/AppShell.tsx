import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

interface NavigationItem {
  to: string;
  label: string;
}

const observerLinks: NavigationItem[] = [
  {
    to: '/reports',
    label: 'Отчеты',
  },
];

const adminLinks: NavigationItem[] = [
  {
    to: '/whitelist/metrics',
    label: 'Исключения метрик',
  },
  {
    to: '/whitelist/targets',
    label: 'Исключения групп объектов',
  },
  {
    to: '/settings/limits',
    label: 'Лимиты',
  },
  {
    to: '/settings/schedule',
    label: 'Расписание',
  },
];

export function AppShell() {
  const auth = useAuth();
  const isAdmin = auth.roles.includes('admin');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const role = auth.roles[0] || 'no-role';
  const navigationItems = isAdmin ? [...observerLinks, ...adminLinks] : observerLinks;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current || menuRef.current.contains(event.target as Node)) {
        return;
      }

      setMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-main">
            <div className="header-brand">Metric Sherlock</div>

            <nav className="header-nav">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) => `header-link${isActive ? ' is-active' : ''}`}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="profile-menu" ref={menuRef}>
            <button
              aria-expanded={menuOpen}
              className={`profile-toggle${menuOpen ? ' is-open' : ''}`}
              onClick={() => setMenuOpen((current) => !current)}
              type="button"
            >
              <span className="profile-role">{role}</span>
              <span aria-hidden="true" className="profile-toggle-icon">
                <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
                  <path
                    d="M3.25 5.25L7 9l3.75-3.75"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              </span>
            </button>

            {menuOpen ? (
              <div className="profile-dropdown">
                <div className="profile-row">
                  <span className="profile-label">Имя</span>
                  <strong className="profile-value">{auth.user?.given_name || '—'}</strong>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Фамилия</span>
                  <strong className="profile-value">{auth.user?.family_name || '—'}</strong>
                </div>
                <div className="profile-row">
                  <span className="profile-label">Роль</span>
                  <strong className="profile-value">{role}</strong>
                </div>

                <div className="profile-actions">
                  <button
                    className="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void auth.logout();
                    }}
                    type="button"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="page-content">
        <div className="page-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
