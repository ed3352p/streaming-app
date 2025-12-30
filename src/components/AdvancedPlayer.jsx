import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react';

export default function AdvancedPlayer({ 
  src, 
  poster, 
  onTimeUpdate, 
  startTime = 0,
  subtitles = [],
  qualities = [],
  onEnded 
}) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [currentSubtitle, setCurrentSubtitle] = useState(null);
  const [buffering, setBuffering] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Initialize HLS if needed
    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });
        
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (startTime > 0) {
            video.currentTime = startTime;
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      }
    } else {
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleWaiting = () => setBuffering(true);
    const handleCanPlay = () => setBuffering(false);
    const handleEnded = () => {
      setPlaying(false);
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, onEnded]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !muted;
    setMuted(!muted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const skip = (seconds) => {
    videoRef.current.currentTime += seconds;
  };

  const changePlaybackRate = (rate) => {
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      style={{ position: 'relative', width: '100%', background: '#000' }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        style={{ width: '100%', display: 'block' }}
        onClick={togglePlay}
      />

      {buffering && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          fontSize: '48px',
        }}>
          <div className="spinner" />
        </div>
      )}

      {showControls && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          padding: '20px',
          transition: 'opacity 0.3s',
        }}>
          {/* Progress bar */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white' }}>
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              {playing ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button onClick={() => skip(-10)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <SkipBack size={20} />
            </button>

            <button onClick={() => skip(10)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <SkipForward size={20} />
            </button>

            <span style={{ fontSize: '14px' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
              <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                style={{ width: '80px' }}
              />

              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <Settings size={20} />
                </button>

                {showSettings && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    right: 0,
                    background: 'rgba(0,0,0,0.9)',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '8px',
                    minWidth: '150px',
                  }}>
                    <div style={{ marginBottom: '8px', fontSize: '12px', opacity: 0.7 }}>Vitesse</div>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        onClick={() => changePlaybackRate(rate)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px',
                          background: playbackRate === rate ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderRadius: '4px',
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <Maximize size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
