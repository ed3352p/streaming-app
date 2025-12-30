import { useEffect } from 'react';
import { isMobile, isTablet, isTouchDevice, setViewportMeta, prefersReducedMotion } from '../utils/mobileUtils';

export default function MobileOptimizer() {
  useEffect(() => {
    const mobile = isMobile();
    const tablet = isTablet();
    const touch = isTouchDevice();
    const reducedMotion = prefersReducedMotion();

    document.documentElement.classList.toggle('is-mobile', mobile);
    document.documentElement.classList.toggle('is-tablet', tablet);
    document.documentElement.classList.toggle('is-touch', touch);
    document.documentElement.classList.toggle('prefers-reduced-motion', reducedMotion);

    setViewportMeta('width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');

    if (mobile || tablet) {
      document.body.style.setProperty('-webkit-tap-highlight-color', 'transparent');
      document.body.style.setProperty('touch-action', 'manipulation');
    }

    const handleOrientationChange = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return null;
}
