import styles from './HeroStats.module.css';

const STATS = [
  { number: '406', label: 'Punti Vendita' },
  { number: '35+', label: 'Anni di Esperienza' },
  { number: '12.000+', label: 'Clienti Soddisfatti' },
];

export default function HeroStats() {
  return (
    <section className={styles.stats}>
      <div className={`container ${styles.grid}`}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <div className={styles.number}>{stat.number}</div>
            <div className={styles.label}>{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
