import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from 'store';
import { logout, selectCurrentUser } from 'store/slices/authSlice';
import { selectTotalNaoLidas } from 'store/slices/conversationSlice';
import { tokenStorage } from 'services/utils/tokenStorage';
import { useWebSocket } from 'hooks/useWebSocket';
import { WsStatusIndicator } from 'components/shared/WsStatusIndicator';
import { ToastContainer } from 'components/shared/ToastContainer';
import styles from './DashboardLayout.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard/inbox', label: 'Conversations', icon: '💬' },
  { to: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
  { to: '/dashboard/clients', label: 'Clients', icon: '👤' },
];

export function DashboardLayout(): React.ReactElement {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const totalUnread = useSelector(selectTotalNaoLidas);
  const token = tokenStorage.getToken();
  const { wsStatus } = useWebSocket(token);

  async function handleLogout() {
    await dispatch(logout());
    navigate('/login');
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className={styles.logo}></span>
          <span className={styles.salonName}>
            Tyflachar
          </span>
        </div>

        <nav className={styles.nav} aria-label="Main menu">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  id={`nav-${item.to.split('/').pop()}`}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                >
                  <span className={styles.navIcon} aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.to.includes('inbox') && totalUnread > 0 && (
                    <span className={styles.badge} aria-label={`${totalUnread} unread`}>
                      {totalUnread > 99 ? '99+' : totalUnread}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.sidebarFooter}>
          <WsStatusIndicator status={wsStatus} />
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <span className={styles.greeting}>
              Hi, <strong>{user?.name ?? 'there'}</strong> 👋
            </span>
          </div>
          <div className={styles.topbarRight}>
            <button
              id="btn-logout"
              className={styles.btnLogout}
              onClick={handleLogout}
              title="Sign out"
            >
              Sign out →
            </button>
          </div>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
