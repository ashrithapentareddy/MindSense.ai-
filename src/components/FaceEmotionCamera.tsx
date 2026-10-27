import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CameraOff,
  Loader2,
  ScanFace,
  Image as ImageIcon,
} from 'lucide-react';
import {
  analyzeFaceEmotion,
  type FaceEmotionPrediction,
  type FaceModelStatus,
} from '@/lib/faceEmotionClassifier';
import ConfidenceBars from './ConfidenceBars';

const faceEmotionColors: Record<string, string> = {
  Angry: 'bg-red-500',
  Disgust: 'bg-lavender-500',
  Fear: 'bg-violet-400',
  Happy: 'bg-cyan-400',
  Sad: 'bg-blue-500',
  Surprise: 'bg-amber-500',
  Neutral: 'bg-slate-500',
};

function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

type CameraState = 'inactive' | 'starting' | 'active' | 'error';

export default function FaceEmotionCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>('inactive');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<FaceModelStatus>('idle');
  const [modelError, setModelError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<FaceEmotionPrediction[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('inactive');
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraState('starting');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Your browser does not support camera access (getUserMedia API not available).'
      );
      setCameraState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('active');
    } catch (e) {
      const err = e as DOMException;
      let msg: string;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Camera permission was denied. Please allow camera access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No camera device was found on this machine.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'The camera is already in use by another application. Close it and try again.';
      } else if (err.name === 'OverconstrainedError') {
        msg = 'No camera matches the requested constraints.';
      } else {
        msg = err.message || 'Failed to access the camera.';
      }
      setCameraError(msg);
      setCameraState('error');
    }
  }, []);

  const handleCaptureAndAnalyze = useCallback(async () => {
    if (cameraState !== 'active' || !videoRef.current || !canvasRef.current) return;

    setInferenceError(null);
    setAnalyzing(true);

    if (modelStatus !== 'ready') {
      setModelStatus('loading');
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setInferenceError('Could not get canvas 2D context for frame capture.');
      setAnalyzing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImageUrl(dataUrl);

    try {
      const results = await analyzeFaceEmotion(dataUrl, (progress) => {
        if (progress.status === 'ready') {
          setModelStatus('ready');
        }
      });
      setPredictions(results);
      setModelStatus('ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error during face emotion inference.';
      console.error('Face emotion inference error:', msg);
      setInferenceError(msg);
      setModelStatus('error');
      setModelError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [cameraState, modelStatus]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const isApiSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices &&
    !!navigator.mediaDevices.getUserMedia;

  const topPrediction = predictions[0];
  const modelStatusLabel =
    modelStatus === 'idle'
      ? 'Model not loaded'
      : modelStatus === 'loading'
        ? 'Loading model...'
        : modelStatus === 'ready'
          ? 'Model ready'
          : 'Model error';

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <ScanFace className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">Facial Expression Recognition</h2>
      </div>

      <div className="rounded-2xl glass-card p-6 sm:p-8 space-y-5">
        {/* Privacy notice */}
        <div className="rounded-xl border border-violet-500/15 bg-ink-800/50 px-4 py-3 text-xs text-slate-400 leading-relaxed">
          Frames are processed locally in your browser and never uploaded or stored.
          The webcam is only activated when you click <strong className="text-violet-300">Start Camera</strong>.
          Results are facial-expression estimates, not mental-health diagnoses.
        </div>

        {/* Browser support warning */}
        {!isApiSupported && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Your browser does not support the camera API needed for this feature.
              Try Chrome, Firefox, or Edge over HTTPS.
            </span>
          </div>
        )}

        {/* Camera controls */}
        <div className="flex flex-wrap items-center gap-3">
          {cameraState !== 'active' ? (
            <button
              onClick={startCamera}
              disabled={!isApiSupported || cameraState === 'starting' || analyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-5 py-2.5 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {cameraState === 'starting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting Camera...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Start Camera
                </>
              )}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 active:scale-95 transition-all"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          )}

          {cameraState === 'active' && (
            <button
              onClick={handleCaptureAndAnalyze}
              disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-xl bg-ink-700 border border-violet-500/25 px-5 py-2.5 text-sm font-semibold text-violet-100 hover:border-violet-400/50 hover:bg-ink-750 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {modelStatus === 'loading' ? 'Loading Model...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Capture &amp; Analyze
                </>
              )}
            </button>
          )}
        </div>

        {/* Camera error */}
        {cameraError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Model error */}
        {modelStatus === 'error' && modelError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong className="text-red-200">Model Error:</strong> {modelError}. The face emotion model needs to
              download from Hugging Face on first use — check your network connection.
            </span>
          </div>
        )}

        {/* Inference error */}
        {inferenceError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Inference failed: {inferenceError}</span>
          </div>
        )}

        {/* Video preview + model status badge */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden border border-violet-500/20 bg-ink-900 aspect-video max-w-2xl shadow-glow-sm">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              style={{ display: cameraState === 'active' ? 'block' : 'none' }}
            />
            {cameraState !== 'active' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Camera className="w-12 h-12 opacity-40" />
                <p className="text-sm">
                  {cameraState === 'starting'
                    ? 'Requesting camera access...'
                    : cameraState === 'error'
                      ? 'Camera unavailable'
                      : 'Camera is off'}
                </p>
              </div>
            )}
            {cameraState === 'active' && (
              <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-white border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-glow-sm" />
                Live
              </div>
            )}
            {cameraState === 'active' && (
              <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-violet-200 border border-violet-500/30">
                {modelStatusLabel}
              </div>
            )}
          </div>
        </div>

        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Captured frame thumbnail */}
        {capturedImageUrl && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">Captured frame (processed locally, not stored):</p>
            <img
              src={capturedImageUrl}
              alt="Captured webcam frame"
              className="rounded-xl border border-violet-500/20 max-h-48 object-cover shadow-glow-sm"
            />
          </div>
        )}

        {/* Results */}
        {predictions.length > 0 && topPrediction && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <div className="rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-violet-700/10 px-5 py-4 shadow-glow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-1">
                Top Facial Expression Estimate
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold capitalize text-white">
                  {topPrediction.label}
                </span>
                <span className="text-lg text-cyan-300">
                  {formatPercent(topPrediction.score)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Model confidence — a facial-expression estimate, not a mental-health diagnosis.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                All Expression Confidence Scores
              </h3>
              <ConfidenceBars
                predictions={predictions}
                emotionColors={faceEmotionColors}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
