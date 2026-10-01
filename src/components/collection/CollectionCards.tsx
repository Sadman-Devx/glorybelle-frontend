import Link from 'next/link';
import styles from './CollectionCards.module.css';

const COLLECTIONS = [
  { title: 'Anelli', slug: 'anelli', image: '/collections/anelli.jpg', description: 'Simboli di eterno amore' },
  { title: 'Collane', slug: 'collane', image: '/collections/collane.jpg', description: 'Eleganza che incornicia' },
  { title: 'Orecchini', slug: 'orecchini', image: '/collections/orecchini.jpg', description: 'Luce e movimento' },
];

export default function CollectionCards() {
  return (
    <div className={styles.grid}>
      {COLLECTIONS.map((col) => (
        <Link key={col.slug} href={`/shop?category=${col.slug}`} className={styles.card}>
          <div className={styles.bg} style={{ backgroundImage: `url(${col.image})` }} />
          <div className={styles.overlay} />
          <div className={styles.content}>
            <span className={styles.label}>{col.description}</span>
            <h3 className={styles.title}>{col.title}</h3>
          </div>
        </Link>
      ))}
    </div>
  );
}
