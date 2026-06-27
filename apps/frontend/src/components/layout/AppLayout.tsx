import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectSidebarOpen } from 'store/slices/uiSlice';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './AppLayout.module.css';

export function AppLayout(): React.ReactElement {
  const sidebarOpen = useSelector(selectSidebarOpen);

  return (
    <div
      className={`${styles.layout} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}
    >
      <Header />
      <Sidebar />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
