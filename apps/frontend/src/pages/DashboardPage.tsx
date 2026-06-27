import React from 'react';
import { useAuth } from 'hooks/useAuth';
import styles from './DashboardPage.module.css';

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps): React.ReactElement {
  return (
    <div className={styles.card}>
      <span className={styles.cardLabel}>{label}</span>
      <span className={styles.cardValue}>{value}</span>
    </div>
  );
}

export function DashboardPage(): React.ReactElement {
  const { user } = useAuth();

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>
          Olá, {user?.name ?? 'seja bem-vindo'} 👋
        </h1>
        <p className={styles.subtitle}>Aqui vai o resumo do seu dashboard.</p>
      </header>

      <div className={styles.grid}>
        <StatCard label="Total de usuários" value="—" />
        <StatCard label="Ativos hoje" value="—" />
        <StatCard label="Pendentes" value="—" />
        <StatCard label="Taxa de conclusão" value="—%" />
      </div>
    </div>
  );
}
