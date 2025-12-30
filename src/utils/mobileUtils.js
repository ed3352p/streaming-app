/**
 * Mobile Utilities for Lumixar Streaming App
 * Provides helper functions for mobile detection and optimization
 */

/**
 * Detect if device is mobile
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detect if device is tablet
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);
};

/**
 * Detect if device is iOS
 */
export const isIOS = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Detect if device is Android
 */
export const isAndroid = () => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

/**
 * Get viewport dimensions
 */
export const getViewport = () => {
  if (typeof window === 'undefined') return { width: 0, height: 0 };
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight
  };
};

/**
 * Check if viewport is in landscape mode
 */
export const isLandscape = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > window.innerHeight;
};

/**
 * Check if device supports touch
 */
export const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Prevent body scroll (useful for modals on mobile)
 */
export const preventBodyScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.width = '100%';
};

/**
 * Allow body scroll
 */
export const allowBodyScroll = () => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.width = '';
};

/**
 * Debounce function for scroll/resize events
 */
export const debounce = (func, wait = 150) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for frequent events
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Get safe area insets (for notched devices)
 */
export const getSafeAreaInsets = () => {
  if (typeof window === 'undefined' || !CSS.supports) return { top: 0, bottom: 0, left: 0, right: 0 };
  
  const getInset = (position) => {
    if (CSS.supports(`padding-${position}`, 'env(safe-area-inset-' + position + ')')) {
      return parseInt(getComputedStyle(document.documentElement).getPropertyValue(`--safe-area-inset-${position}`)) || 0;
    }
    return 0;
  };

  return {
    top: getInset('top'),
    bottom: getInset('bottom'),
    left: getInset('left'),
    right: getInset('right')
  };
};

/**
 * Vibrate device (if supported)
 */
export const vibrate = (duration = 50) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(duration);
  }
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get device pixel ratio
 */
export const getPixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  return window.devicePixelRatio || 1;
};

/**
 * Check if device is in standalone mode (PWA)
 */
export const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

/**
 * Smooth scroll to element
 */
export const smoothScrollTo = (element, offset = 0) => {
  if (typeof window === 'undefined' || !element) return;
  
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  
  if (prefersReducedMotion()) {
    window.scrollTo(0, targetPosition);
  } else {
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
};

/**
 * Lock orientation (if supported)
 */
export const lockOrientation = (orientation = 'portrait') => {
  if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
    screen.orientation.lock(orientation).catch(() => {
      console.log('Orientation lock not supported');
    });
  }
};

/**
 * Get network information
 */
export const getNetworkInfo = () => {
  if (typeof navigator === 'undefined' || !navigator.connection) {
    return { effectiveType: 'unknown', downlink: 0, rtt: 0 };
  }
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
};

/**
 * Check if device has good network connection
 */
export const hasGoodConnection = () => {
  const network = getNetworkInfo();
  return network.effectiveType === '4g' || network.effectiveType === 'unknown';
};

/**
 * Add viewport meta tag dynamically
 */
export const setViewportMeta = (content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes') => {
  if (typeof document === 'undefined') return;
  
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  viewport.content = content;
};

/**
 * Format bytes to human readable
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Check if element is in viewport
 */
export const isInViewport = (element) => {
  if (typeof window === 'undefined' || !element) return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export default {
  isMobile,
  isTablet,
  isIOS,
  isAndroid,
  getViewport,
  isLandscape,
  isTouchDevice,
  preventBodyScroll,
  allowBodyScroll,
  debounce,
  throttle,
  getSafeAreaInsets,
  vibrate,
  prefersReducedMotion,
  getPixelRatio,
  isStandalone,
  smoothScrollTo,
  lockOrientation,
  getNetworkInfo,
  hasGoodConnection,
  setViewportMeta,
  formatBytes,
  isInViewport
};
