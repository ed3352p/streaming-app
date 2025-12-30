import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ScreenRecordingDetector() {
  const { user } = useAuth();
  const detectionIntervalRef = useRef(null);
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (!user) return;

    startDetection();

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [user]);

  const startDetection = () => {
    checkScreenCapture();
    checkMediaRecorder();
    checkDevTools();
    monitorVisibilityChanges();

    detectionIntervalRef.current = setInterval(() => {
      checkScreenCapture();
      checkDevTools();
    }, 5000);
  };

  const checkScreenCapture = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
        
        navigator.mediaDevices.getDisplayMedia = function(...args) {
          reportDetection('screen_capture_api', {
            method: 'getDisplayMedia intercepted'
          });
          return originalGetDisplayMedia.apply(this, args);
        };
      }
    } catch (error) {
      console.error('Screen capture detection error:', error);
    }
  };

  const checkMediaRecorder = () => {
    if (window.MediaRecorder) {
      const originalStart = MediaRecorder.prototype.start;
      
      MediaRecorder.prototype.start = function(...args) {
        reportDetection('media_recorder_api', {
          mimeType: this.mimeType,
          state: this.state
        });
        return originalStart.apply(this, args);
      };
    }
  };

  const checkDevTools = () => {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;

    if (widthThreshold || heightThreshold) {
      reportDetection('devtools_open', {
        outerWidth: window.outerWidth,
        innerWidth: window.innerWidth,
        outerHeight: window.outerHeight,
        innerHeight: window.innerHeight
      });
    }
  };

  const monitorVisibilityChanges = () => {
    let hiddenCount = 0;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenCount++;
        
        if (hiddenCount > 10) {
          reportDetection('rapid_screenshot', {
            hiddenCount,
            suspiciousActivity: true
          });
        }
      }
    });
  };

  const reportDetection = async (detectionType, metadata) => {
    if (warningShownRef.current) return;

    try {
      const response = await fetch('/api/security/recording-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          detectionType,
          metadata
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.blocked) {
          showBlockedWarning();
          warningShownRef.current = true;
        } else if (data.warning) {
          showWarning(detectionType);
        }
      }
    } catch (error) {
      console.error('Detection report error:', error);
    }
  };

  const showWarning = (detectionType) => {
    const messages = {
      screen_capture_api: 'Enregistrement d\'écran détecté',
      media_recorder_api: 'Enregistrement média détecté',
      devtools_open: 'Outils de développement détectés',
      rapid_screenshot: 'Activité suspecte détectée'
    };

    console.warn(`🚫 ${messages[detectionType] || 'Activité suspecte détectée'}`);
  };

  const showBlockedWarning = () => {
    alert('⚠️ Votre compte a été temporairement bloqué en raison d\'une activité suspecte d\'enregistrement. Veuillez contacter le support.');
    
    setTimeout(() => {
      window.location.href = '/';
    }, 3000);
  };

  return null;
}
