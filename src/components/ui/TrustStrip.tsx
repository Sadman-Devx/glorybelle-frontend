import styles from './TrustStrip.module.css';

const TRUST_ITEMS = [
  { icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', title: 'Spedizione Gratuita', desc: 'Assicurata in tutta Italia' },
  { icon: 'M1 4v6h6M23 20v-6h-6', title: 'Reso Gratuito', desc: 'Entro 30 giorni' },
  { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', title: 'Certificato', desc: 'Autenticita garantita' },
  { icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2', title: 'Pagamento Sicuro', desc: 'Crittografia SSL' },
];

export default function TrustStrip() {
  return (
    <div className={styles.strip}>
      <div className={`container ${styles.inner}`}>
        {TRUST_ITEMS.map((item) => (
          <div key={item.title} className={styles.item}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={styles.icon}>
              <path d={item.icon} />
            </svg>
            <div className={styles.text}>
              <span className={styles.title}>{item.title}</span>
              <span className={styles.desc}>{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
