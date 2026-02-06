import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Square, Play, Pause, Download, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoRecorderProps {
  onClose: () => void;
  onRecordingComplete?: (videoUrl: string) => void;
}

export function VideoRecorder({ onClose, onRecordingComplete }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('video/mp4');

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(0.25);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          audio: false
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
      // Cleanup
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
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
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedVideoUrl(url);
      onRecordingComplete?.(url);
    };

    mediaRecorder.start(100);
    setIsRecording(true);
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const togglePlayback = useCallback(() => {
    if (playbackRef.current) {
      if (isPlaying) {
        playbackRef.current.pause();
      } else {
        playbackRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (playbackRef.current) {
      playbackRef.current.playbackRate = rate;
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

  const handleRetake = useCallback(() => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedBlob(null);
    setIsPlaying(false);
  }, [recordedVideoUrl]);

  const playbackRates = [
    { value: 0.125, label: '0.125x' },
    { value: 0.25, label: '0.25x' },
    { value: 0.5, label: '0.5x' },
    { value: 1, label: '1x' },
  ];

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white text-center mb-4">{error}</p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
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
        {recordedVideoUrl && (
          <div className="flex gap-2">
            {playbackRates.map((rate) => (
              <button
                key={rate.value}
                onClick={() => handlePlaybackRateChange(rate.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all',
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
      <div className="flex-1 flex items-center justify-center">
        {recordedVideoUrl ? (
          <video
            ref={playbackRef}
            src={recordedVideoUrl}
            className="w-full h-full object-contain"
            playsInline
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={() => {
              if (playbackRef.current) {
                playbackRef.current.playbackRate = playbackRate;
              }
            }}
          />
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
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {recordedVideoUrl ? (
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRetake}
              className="w-14 h-14 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayback}
              className="w-20 h-20 rounded-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="w-14 h-14 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <Download className="w-6 h-6" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {cameraReady ? (
              <button
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={isRecording ? stopRecording : undefined}
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
        )}
        
        {!recordedVideoUrl && cameraReady && (
          <p className="text-white/60 text-center text-sm mt-4">
            Hold to record
          </p>
        )}
      </div>
    </div>
  );
}
