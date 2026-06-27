import React from 'react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from 'store/slices/uiSlice';
import { useAuth } from 'hooks/useAuth';
import { Button } from 'components/ui/Button';
import type { AppDispatch } from 'store';
import styles from './Header.module.css';

function MenuIcon(): React.ReactElement {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function Header(): React.ReactElement {
  const dispatch = useDispatch<AppDispatch>();
  const { user, logout } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          className={styles.menuButton}
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Alternar menu lateral"
          type="button"
        >
          <MenuIcon />
        </button>
        <span className={styles.appName}>
          {process.env['REACT_APP_NAME'] ?? 'GSD App'}
        </span>
      </div>

      <div className={styles.right}>
        {user !== null && (
          <>
            <span className={styles.userName}>{user.name}</span>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sair
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
