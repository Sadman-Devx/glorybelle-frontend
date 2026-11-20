'use client';

import { useState } from 'react';
import styles from './Stamps.module.css';

interface Stamp {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const DEFAULT_STAMPS: Stamp[] = [
  {
    key: 'selezione',
    label: 'Selezione',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3 7h7l-5.5 4.3L18.5 21 12 16.7 5.5 21l2-7.7L2 9h7l3-7Z" />
      </svg>
    ),
  },
  {
    key: 'fusione',
    label: 'Fusione',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z" />
      </svg>
    ),
  },
  {
    key: 'lavorazione',
    label: 'Lavorazione',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L4 9l8 13 8-13-8-7z" />
        <path d="M4 9h16M8.5 9L12 2l3.5 7M8.5 9L12 22M15.5 9L12 22" opacity="0.6" />
      </svg>
    ),
  },
  {
    key: 'garanzia',
    label: 'Garanzia',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h9l7 7-9 9-7-7V4Z" />
        <circle cx="8.5" cy="8.5" r="1.3" />
      </svg>
    ),
  },
];

interface StampsProps {
  stamps?: Stamp[];
  defaultActive?: string;
  onChange?: (key: string) => void;
}

export default function Stamps({
  stamps = DEFAULT_STAMPS,
  defaultActive,
  onChange,
}: StampsProps) {
  const [active, setActive] = useState<string | undefined>(defaultActive);

  const handleClick = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div className={styles.stamps} role="tablist" aria-label="Fasi del processo">
      {stamps.map((s) => (
        <button
          key={s.key}
          type="button"
          className={`${styles.stamp} ${active === s.key ? styles.active : ''}`}
          onClick={() => handleClick(s.key)}
          role="tab"
          aria-selected={active === s.key}
          aria-label={s.label}
        >
          <span className={styles.circle} aria-hidden="true">
            {s.icon}
          </span>
          <span className={styles.label}>{s.label}</span>
        </button>
      ))}
    </div>
  );
}