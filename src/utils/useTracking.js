import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export function useViewTracking(contentId, contentType, title, genre) {
  const { user } = useAuth();
  const startTimeRef = useRef(Date.now());
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const trackedRef = useRef(false);

  useEffect(() => {
    if (!contentId || trackedRef.current) return;

    const trackView = async () => {
      try {
        await api.trackView({
          contentId,
          contentType,
          title,
          genre,
          userId: user?.id,
          watchTime: 0,
          progress: 0
        });
        trackedRef.current = true;
      } catch (err) {
        console.error('Failed to track view:', err);
      }
    };

    trackView();

    const trackSession = async () => {
      try {
        await api.trackSession({
          sessionId: sessionIdRef.current,
          userId: user?.id,
          contentId,
          contentType
        });
      } catch (err) {
        console.error('Failed to track session:', err);
      }
    };

    trackSession();
    const sessionInterval = setInterval(trackSession, 30000);

    return () => {
      clearInterval(sessionInterval);
      
      const watchTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (watchTime > 5) {
        api.trackView({
          contentId,
          contentType,
          title,
          genre,
          userId: user?.id,
          watchTime,
          progress: 0.5
        }).catch(err => console.error('Failed to track final view:', err));
      }
    };
  }, [contentId, contentType, title, genre, user?.id]);

  return sessionIdRef.current;
}

export function useBandwidthTracking() {
  const bytesRef = useRef(0);

  useEffect(() => {
    const trackBandwidth = async () => {
      if (bytesRef.current > 0) {
        try {
          await api.trackBandwidth({
            bytes: bytesRef.current,
            type: 'video'
          });
          bytesRef.current = 0;
        } catch (err) {
          console.error('Failed to track bandwidth:', err);
        }
      }
    };

    const interval = setInterval(trackBandwidth, 60000);
    return () => {
      clearInterval(interval);
      trackBandwidth();
    };
  }, []);

  const addBytes = (bytes) => {
    bytesRef.current += bytes;
  };

  return { addBytes };
}
