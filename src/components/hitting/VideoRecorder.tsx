import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Video, Square, Play, Pause, Download, X, RotateCcw,
  SkipBack, SkipForward, Save, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingOverlay } from './DrawingOverlay';
import { useVideoStorage } from '@/hooks/useVideoStorage';

interface VideoRecorderProps {
  onClose: () => void;
  onRecordingComplete?: (videoUrl: string) => void;
  /** If provided, enables "Save" to Supabase Storage and returns the public URL */
  onSave?: (publicUrl: string) => void;
  playerId?: string;
}

export function VideoRecorder({ onClose, onRecordingComplete, onSave, playerId }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('video/mp4');
  const animFrameRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.25);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlayback, setShowPlayback] = useState(false);

  // Frame-by-frame state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Drawing state
  const [drawingActive, setDrawingActive] = useState(false);

  // Storage
  const { uploadVideo, isUploading, uploadError } = useVideoStorage();
  const [saved, setSaved] = useState(false);

  // Frame stepping: ~1/30s per frame (most phone video is 30fps)
  const FRAME_STEP = 1 / 30;

  // Time tracking loop
  const startTimeTracking = useCallback(() => {
    const update = () => {
      if (playbackRef.current && !isSeeking) {
        setCurrentTime(playbackRef.current.currentTime);
      }
      animFrameRef.current = requestAnimationFrame(update);
    };
    animFrameRef.current = requestAnimationFrame(update);
  }, [isSeeking]);

  const stopTimeTracking = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    if (showPlayback) {
      startTimeTracking();
    }
    return () => stopTimeTracking();
  }, [showPlayback, startTimeTracking, stopTimeTracking]);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 60, min: 30 }
          },
          audio: true
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Could not access camera. Please allow camera permissions.');
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      stopTimeTracking();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
    // Try MP4 first (iOS/Safari), then WebM (Chrome/Firefox)
    const mimeTypes = [
      'video/mp4',
      'video/mp4;codecs=avc1',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm',
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    mimeTypeRef.current = selectedMimeType || 'video/mp4';
    
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(streamRef.current, { 
        mimeType: selectedMimeType || undefined 
      });
    } catch {
      // Final fallback
      mediaRecorder = new MediaRecorder(streamRef.current);
    }

    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (chunksRef.current.length === 0) return;

      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current || 'video/mp4' });
      const url = URL.createObjectURL(blob);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setRecordedBlob(blob);
      setRecordedVideoUrl(url);
      setShowPlayback(true);
      onRecordingComplete?.(url);
    };

    mediaRecorder.start(100);
    setIsRecording(true);
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const togglePlayback = useCallback(async () => {
    if (!playbackRef.current) return;
    if (drawingActive) return; // Don't toggle play when drawing

    if (isPlaying) {
      playbackRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await playbackRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Playback error:', err);
      }
    }
  }, [isPlaying, drawingActive]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (playbackRef.current) {
      playbackRef.current.playbackRate = rate;
    }
  }, []);

  // Frame-by-frame navigation
  const stepFrame = useCallback((direction: 'forward' | 'back') => {
    if (!playbackRef.current) return;
    playbackRef.current.pause();
    setIsPlaying(false);

    const newTime = direction === 'forward'
      ? Math.min(playbackRef.current.currentTime + FRAME_STEP, duration)
      : Math.max(playbackRef.current.currentTime - FRAME_STEP, 0);

    playbackRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, FRAME_STEP]);

  // Jump by 0.5s chunks
  const jumpTime = useCallback((direction: 'forward' | 'back') => {
    if (!playbackRef.current) return;
    const jump = 0.5;
    const newTime = direction === 'forward'
      ? Math.min(playbackRef.current.currentTime + jump, duration)
      : Math.max(playbackRef.current.currentTime - jump, 0);

    playbackRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Seekbar
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (playbackRef.current) {
      playbackRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!recordedBlob) return;

    // Determine file extension based on mime type
    const isMP4 = mimeTypeRef.current.includes('mp4');
    const extension = isMP4 ? 'mp4' : 'webm';
    const filename = `swing-${Date.now()}.${extension}`;

    try {
      const file = new File([recordedBlob], filename, { type: mimeTypeRef.current });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Swing Video',
        });
      } else {
        // Fallback: download the file
        const url = URL.createObjectURL(recordedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share error:', err);
      // Fallback to download
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [recordedBlob]);

  const handleSaveToStorage = useCallback(async () => {
    if (!recordedBlob || !playerId) return;

    const publicUrl = await uploadVideo(recordedBlob, playerId, mimeTypeRef.current);
    if (publicUrl) {
      setSaved(true);
      onSave?.(publicUrl);
    }
  }, [recordedBlob, playerId, uploadVideo, onSave]);

  const handleRetake = useCallback(async () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setIsPlaying(false);
    setShowPlayback(false);
    setCurrentTime(0);
    setDuration(0);
    setDrawingActive(false);
    setSaved(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, min: 30 }
        },
        audio: true
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera restart error:', err);
    }
  }, [recordedVideoUrl]);

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const playbackRates = [
    { value: 0.125, label: '\u215Bx' },
    { value: 0.25, label: '\u00BCx' },
    { value: 0.5, label: '\u00BDx' },
    { value: 1, label: '1x' },
  ];

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white text-center mb-4">{error}</p>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
        {showPlayback && recordedVideoUrl && (
          <div className="flex gap-1.5">
            {playbackRates.map((rate) => (
              <button
                key={rate.value}
                onClick={() => handlePlaybackRateChange(rate.value)}
                className={cn(
                  'px-2.5 py-1.5 rounded-full text-xs font-bold transition-all',
                  playbackRate === rate.value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                {rate.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Video Display */}
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {showPlayback && recordedVideoUrl ? (
          <>
            <video
              ref={playbackRef}
              src={recordedVideoUrl}
              className="w-full h-full object-contain"
              playsInline
              loop
              preload="auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedMetadata={() => {
                if (playbackRef.current) {
                  playbackRef.current.playbackRate = playbackRate;
                  setDuration(playbackRef.current.duration);
                }
              }}
            />
            {/* Drawing overlay */}
            <DrawingOverlay
              active={drawingActive}
              onToggle={() => {
                setDrawingActive(!drawingActive);
                if (!drawingActive && playbackRef.current) {
                  playbackRef.current.pause();
                  setIsPlaying(false);
                }
              }}
            />
          </>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent">
        {showPlayback && recordedVideoUrl ? (
          <div className="px-4 pb-6 pt-12 space-y-3">
            {/* Seekbar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={FRAME_STEP}
                value={currentTime}
                onChange={handleSeek}
                onMouseDown={() => setIsSeeking(true)}
                onMouseUp={() => setIsSeeking(false)}
                onTouchStart={() => setIsSeeking(true)}
                onTouchEnd={() => setIsSeeking(false)}
                className="w-full h-1.5 appearance-none bg-white/30 rounded-full outline-none
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-grab
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-accent
                  [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
              />
              <div className="flex justify-between text-[10px] text-white/50 font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Frame-by-frame + main controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => jumpTime('back')}
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => stepFrame('back')}
                className="w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={handleRetake}
                className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={togglePlayback}
                className="w-16 h-16 rounded-full bg-accent text-accent-foreground flex items-center justify-center hover:bg-accent/90"
              >
                {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-0.5" />}
              </button>
              <button
                onClick={handleShare}
                className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => stepFrame('forward')}
                className="w-11 h-11 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              <button
                onClick={() => jumpTime('forward')}
                className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Save to cloud button (only if playerId provided) */}
            {playerId && onSave && (
              <div className="flex flex-col items-center pt-1">
                {saved ? (
                  <span className="text-green-400 text-xs font-medium">Saved to player profile</span>
                ) : (
                  <button
                    onClick={handleSaveToStorage}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-white text-sm font-medium hover:bg-white/25 disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isUploading ? 'Saving...' : 'Save to Profile'}
                  </button>
                )}
                {uploadError && (
                  <p className="text-red-400 text-xs mt-1 text-center">{uploadError}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 pb-6 pt-12">
            <div className="flex items-center justify-center">
              {cameraReady ? (
                <button
                  onClick={toggleRecording}
                  className={cn(
                    'w-20 h-20 rounded-full border-4 transition-all flex items-center justify-center',
                    isRecording
                      ? 'bg-destructive border-destructive scale-110'
                      : 'bg-white/20 border-white hover:bg-white/30'
                  )}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8 text-white fill-white" />
                  ) : (
                    <Video className="w-8 h-8 text-white" />
                  )}
                </button>
              ) : (
                <div className="text-white text-center">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Starting camera...</p>
                </div>
              )}
            </div>

            {cameraReady && (
              <p className="text-white/60 text-center text-sm mt-4">
                {isRecording ? 'Tap to stop' : 'Tap to record'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
