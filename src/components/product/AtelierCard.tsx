import Link from 'next/link';
import styles from './AtelierCard.module.css';

interface AtelierCardProps {
  title: string;
  subtitle: string;
  href: string;
  icon?: 'ring' | 'necklace' | 'earrings';
}

const ICONS = {
  ring: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="7" />
      <polygon points="12,3 15,8 9,8" />
    </svg>
  ),
  necklace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4c0 7 4 11 8 11s8-4 8-11" />
      <circle cx="12" cy="17" r="2.4" />
    </svg>
  ),
  earrings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="6" r="2" />
      <path d="M12 8v3" />
      <polygon points="12,11 17,18 7,18" />
    </svg>
  ),
};

export default function AtelierCard({
  title,
  subtitle,
  href,
  icon = 'ring',
}: AtelierCardProps) {
  return (
    <Link href={href} className={styles.atelierCard}>
      <span className={styles.icon} aria-hidden="true">
        {ICONS[icon]}
      </span>
      <h4 className={styles.title}>{title}</h4>
      <span className={styles.subtitle}>{subtitle}</span>
      <span className={styles.cta}>
        Scopri di più
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}