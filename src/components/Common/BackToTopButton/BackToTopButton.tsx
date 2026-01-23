'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import styles from './BackToTopButton.module.scss';

const SHOW_AT_PX = 240;

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const mainContent = document.querySelector('main');
    const scrollTarget: HTMLElement | Window = mainContent || window;

    const getScrollTop = () =>
      mainContent ? mainContent.scrollTop : window.scrollY || 0;

    const handleScroll = () => {
      const shouldShow = getScrollTop() > SHOW_AT_PX;
      setIsVisible(prevVisible =>
        prevVisible === shouldShow ? prevVisible : shouldShow
      );
    };

    handleScroll();
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = () => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      className={`${styles.backToTop} ${isVisible ? styles.visible : ''}`}
      onClick={handleClick}
      aria-label="Back to top"
    >
      <ArrowUp size={16} />
    </button>
  );
}
