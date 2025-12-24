import { useState, useEffect } from 'react';
import { Cast } from 'lucide-react';

export function CastButton({ videoUrl, title, imageUrl }) {
  const [castAvailable, setCastAvailable] = useState(false);
  const [casting, setCasting] = useState(false);

  useEffect(() => {
    if (window.chrome && window.chrome.cast) {
      window['__onGCastApiAvailable'] = (isAvailable) => {
        if (isAvailable) {
          initializeCastApi();
        }
      };
    }

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const initializeCastApi = () => {
    const cast = window.chrome.cast;
    const sessionRequest = new cast.SessionRequest(cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    const apiConfig = new cast.ApiConfig(
      sessionRequest,
      sessionListener,
      receiverListener
    );

    cast.initialize(apiConfig, onInitSuccess, onError);
  };

  const onInitSuccess = () => {
    setCastAvailable(true);
  };

  const onError = (error) => {
    console.error('Cast error:', error);
  };

  const sessionListener = (session) => {
    console.log('New session:', session);
    setCasting(true);
  };

  const receiverListener = (availability) => {
    setCastAvailable(availability === 'available');
  };

  const startCasting = () => {
    const cast = window.chrome.cast;
    cast.requestSession(
      (session) => {
        const mediaInfo = new cast.media.MediaInfo(videoUrl, 'video/mp4');
        mediaInfo.metadata = new cast.media.GenericMediaMetadata();
        mediaInfo.metadata.title = title;
        mediaInfo.metadata.images = [new cast.Image(imageUrl)];

        const request = new cast.media.LoadRequest(mediaInfo);
        session.loadMedia(request, onMediaDiscovered, onMediaError);
      },
      onError
    );
  };

  const onMediaDiscovered = (media) => {
    console.log('Media discovered:', media);
    setCasting(true);
  };

  const onMediaError = (error) => {
    console.error('Media error:', error);
  };

  const stopCasting = () => {
    const cast = window.chrome.cast;
    const session = cast.framework.CastContext.getInstance().getCurrentSession();
    if (session) {
      session.endSession(true);
      setCasting(false);
    }
  };

  if (!castAvailable) {
    return null;
  }

  return (
    <button
      onClick={casting ? stopCasting : startCasting}
      style={{
        background: casting ? '#ef4444' : '#3b82f6',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        fontWeight: '600'
      }}
    >
      <Cast size={20} />
      {casting ? 'Arrêter Cast' : 'Caster vers TV'}
    </button>
  );
}
