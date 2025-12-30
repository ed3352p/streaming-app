import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export default function DeviceFingerprint({ onFingerprintGenerated }) {
  const [fingerprint, setFingerprint] = useState(null);

  useEffect(() => {
    generateFingerprint();
  }, []);

  const generateFingerprint = async () => {
    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();

      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        touchSupport: 'ontouchstart' in window,
        canvas: result.components.canvas?.value,
        webgl: result.components.webgl?.value,
        fonts: result.components.fonts?.value,
        plugins: result.components.plugins?.value,
        audioContext: result.components.audio?.value
      };

      const fingerprintData = {
        visitorId: result.visitorId,
        confidence: result.confidence,
        deviceInfo
      };

      setFingerprint(fingerprintData);
      
      if (onFingerprintGenerated) {
        onFingerprintGenerated(fingerprintData);
      }

      localStorage.setItem('deviceFingerprint', JSON.stringify(fingerprintData));
    } catch (error) {
      console.error('Fingerprint generation error:', error);
    }
  };

  return null;
}
