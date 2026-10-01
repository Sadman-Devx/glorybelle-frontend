'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './RevealOnScroll.module.css';

interface RevealOnScrollProps {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3;
  className?: string;
}

export default function RevealOnScroll({ children, delay = 0, className = '' }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(el); } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayClass = delay > 0 ? styles[`d${delay}`] : '';

  return (
    <div ref={ref} className={`${styles.reveal} ${isVisible ? styles.visible : ''} ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
