import styles from './HeroStats.module.css';

const STATS = [
  { value: '406', label: 'Punti Vendita' },
  { value: '35+', label: 'Anni di Esperienza' },
  { value: '12.000+', label: 'Clienti Soddisfatti' },
];

/**
 * HeroStats — design.md §4.3
 * Static trust numbers (no count-up animation per design decision)
 */
export default function HeroStats() {
  return (
    <div className={styles.stats}>
      {STATS.map((stat, i) => (
        <div key={stat.label} className={styles.statItem}>
          {i > 0 && <div className={styles.divider} />}
          <span className={styles.value}>{stat.value}</span>
          <span className={styles.label}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
