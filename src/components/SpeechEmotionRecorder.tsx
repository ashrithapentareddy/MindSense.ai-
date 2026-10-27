import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  Upload,
  Play,
  Pause,
  RotateCcw,
  AudioWaveform,
  Sparkles,
} from 'lucide-react';
import {
  analyzeSpeechEmotion,
  audioBufferToMono,
  type SpeechEmotionPrediction,
  type SpeechModelStatus,
} from '@/lib/speechEmotionClassifier';
import ConfidenceBars from './ConfidenceBars';

const speechEmotionColors: Record<string, string> = {
  Angry: 'bg-red-500',
  Calm: 'bg-cyan-400',
  Disgust: 'bg-lavender-500',
  Fearful: 'bg-violet-400',
  Happy: 'bg-cyan-400',
  Sad: 'bg-blue-500',
  Surprised: 'bg-amber-500',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_DURATION_SECONDS = 30;
const ACCEPTED_TYPES = ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/webm', 'audio/flac'];
const SUPPORTED_LABELS = ['Angry', 'Calm', 'Disgust', 'Fearful', 'Happy', 'Sad', 'Surprised'];
const WAVEFORM_BARS = 28;

function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type RecorderState = 'inactive' | 'recording' | 'error';

type AudioSource = {
  blob: Blob;
  url: string;
  duration: number;
  name: string;
};

export default function SpeechEmotionRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const [recorderState, setRecorderState] = useState<RecorderState>('inactive');
  const [micError, setMicError] = useState<string | null>(null);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const recordTimerRef = useRef<number | null>(null);
  const [waveform, setWaveform] = useState<number[]>(() => new Array(WAVEFORM_BARS).fill(0.15));

  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [modelStatus, setModelStatus] = useState<SpeechModelStatus>('idle');
  const [modelError, setModelError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<SpeechEmotionPrediction[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Live waveform animation driven by the analyser node while recording.
  const drawWaveform = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    const step = Math.floor(data.length / WAVEFORM_BARS);
    const bars: number[] = [];
    for (let i = 0; i < WAVEFORM_BARS; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += data[i * step + j];
      const avg = sum / step / 255;
      bars.push(Math.max(0.12, Math.min(1, avg * 1.4)));
    }
    setWaveform(bars);
    rafRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordTimerRef.current !== null) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    setWaveform(new Array(WAVEFORM_BARS).fill(0.15));
    stopStream();
    setRecorderState('inactive');
  }, [stopStream]);

  const startRecording = useCallback(async () => {
    setMicError(null);
    setUploadError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError(
        'Your browser does not support microphone access. You can still upload an audio file below.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // Set up analyser for live waveform.
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      rafRef.current = requestAnimationFrame(drawWaveform);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });
        chunksRef.current = [];

        // Close the live analyser context; reopen for decode.
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        try {
          const arrayBuffer = await blob.arrayBuffer();
          const ctx2 = new AudioContext();
          audioContextRef.current = ctx2;
          const audioBuffer = await ctx2.decodeAudioData(arrayBuffer);
          const url = URL.createObjectURL(blob);
          setAudioSource({
            blob,
            url,
            duration: audioBuffer.duration,
            name: 'Recording.webm',
          });
        } catch {
          const url = URL.createObjectURL(blob);
          setAudioSource({ blob, url, duration: 0, name: 'Recording.webm' });
        }
      };

      setRecorderState('recording');
      setRecordingElapsed(0);
      recorder.start();
      recordTimerRef.current = window.setInterval(() => {
        setRecordingElapsed((prev) => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      const err = e as DOMException;
      let msg: string;
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. You can still upload an audio file below.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No microphone was found. You can still upload an audio file below.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'The microphone is already in use by another application. Close it and try again.';
      } else {
        msg = err.message || 'Failed to access the microphone.';
      }
      setMicError(msg);
      setRecorderState('error');
      stopStream();
    }
  }, [stopStream, stopRecording, drawWaveform]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadError(null);
      setInferenceError(null);

      if (file.size === 0) {
        setUploadError('The selected file is empty. Please choose a valid audio file.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `The file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`
        );
        return;
      }

      const isTypeAccepted =
        ACCEPTED_TYPES.includes(file.type) ||
        /\.(wav|mp3|ogg|webm|flac|m4a|aac)$/i.test(file.name);
      if (!isTypeAccepted) {
        setUploadError(
          'Unsupported file type. Please upload a WAV, MP3, OGG, WebM, FLAC, M4A, or AAC audio file.'
        );
        return;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        if (audioBuffer.duration > MAX_DURATION_SECONDS) {
          setUploadError(
            `Audio is too long (${formatDuration(audioBuffer.duration)}). Please keep it under ${MAX_DURATION_SECONDS} seconds.`
          );
          return;
        }
        if (audioBuffer.duration < 0.3) {
          setUploadError('Audio is too short (under 0.3s). Please record or upload at least a short utterance.');
          return;
        }

        const url = URL.createObjectURL(file);
        setAudioSource({
          blob: file,
          url,
          duration: audioBuffer.duration,
          name: file.name,
        });
        setPredictions([]);
      } catch {
        setUploadError(
          'Could not decode this audio file. It may be corrupted or in an unsupported format. Try a WAV file.'
        );
      }
    },
    []
  );

  const onFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = '';
    },
    [handleFileUpload]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!audioSource) return;

    setInferenceError(null);
    setAnalyzing(true);
    if (modelStatus !== 'ready') setModelStatus('loading');

    try {
      const arrayBuffer = await audioSource.blob.arrayBuffer();
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const mono = audioBufferToMono(audioBuffer);

      // Detect silence: near-zero RMS across the whole clip.
      let sumSq = 0;
      for (let i = 0; i < mono.length; i++) sumSq += mono[i] * mono[i];
      const rms = Math.sqrt(sumSq / mono.length);
      if (rms < 1e-4) {
        setInferenceError(
          'The recording appears to be silent. Please record or upload audio that contains speech.'
        );
        setAnalyzing(false);
        setModelStatus('idle');
        return;
      }

      const results = await analyzeSpeechEmotion(mono, audioBuffer.sampleRate, (progress) => {
        if (progress.status === 'ready') setModelStatus('ready');
      });
      setPredictions(results);
      setModelStatus('ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error during speech emotion inference.';
      console.error('Speech emotion inference error:', msg);
      setInferenceError(msg);
      setModelStatus('error');
      setModelError(msg);
    } finally {
      setAnalyzing(false);
    }
  }, [audioSource, modelStatus]);

  const handleReset = useCallback(() => {
    setPredictions([]);
    setInferenceError(null);
    setUploadError(null);
    setMicError(null);
    setRecorderState('inactive');
    setRecordingElapsed(0);
    if (audioSource) URL.revokeObjectURL(audioSource.url);
    setAudioSource(null);
    setIsPlaying(false);
    setWaveform(new Array(WAVEFORM_BARS).fill(0.15));
  }, [audioSource]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current !== null) window.clearInterval(recordTimerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (audioSource) URL.revokeObjectURL(audioSource.url);
    };
  }, [audioSource]);

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

  const isRecording = recorderState === 'recording';

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <AudioWaveform className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">Speech Emotion Recognition</h2>
      </div>

      <div className="rounded-2xl glass-card p-6 sm:p-8 space-y-6">
        {/* Privacy + disclaimer notice */}
        <div className="rounded-xl border border-violet-500/15 bg-ink-800/50 px-4 py-3 text-xs text-slate-400 leading-relaxed">
          Audio is processed locally in your browser and never uploaded or stored.
          The microphone is only activated when you press <strong className="text-violet-300">Start Recording</strong>.
          Speech emotion recognition is an estimate and may be affected by language,
          accent, recording quality, background noise, and individual differences — it is
          not a mental-health diagnosis.
        </div>

        {/* Browser support warning */}
        {!isApiSupported && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              Your browser does not support the microphone API, but you can still
              upload an audio file below.
            </span>
          </div>
        )}

        {/* Circular mic control + live waveform */}
        <div className="flex flex-col items-center gap-5 py-2">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring while recording */}
            {isRecording && (
              <span className="absolute w-28 h-28 rounded-full border border-violet-400/50 animate-pulse-ring" />
            )}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isApiSupported || analyzing}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isRecording
                  ? 'bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_32px_-2px_rgba(239,68,68,0.6)]'
                  : 'bg-gradient-to-br from-violet-500 to-violet-800 shadow-glow hover:shadow-[0_0_36px_-2px_rgba(124,77,255,0.65)]'
              }`}
            >
              <div className="absolute inset-0 rounded-full ring-1 ring-violet-300/30" />
              {isRecording ? (
                <MicOff className="w-9 h-9 text-white" />
              ) : (
                <Mic className="w-9 h-9 text-white" />
              )}
            </button>
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className="text-sm font-medium text-slate-300">
              {isRecording
                ? 'Recording...'
                : recorderState === 'error'
                  ? 'Microphone unavailable'
                  : 'Tap to record from your microphone'}
            </p>
            {isRecording && (
              <p className="text-xs text-violet-300 mt-1 tabular-nums">
                {formatDuration(recordingElapsed)} / {formatDuration(MAX_DURATION_SECONDS)}
              </p>
            )}
          </div>

          {/* Animated waveform — only visible while recording */}
          <div className="flex items-end justify-center gap-1 h-16 w-full max-w-md">
            {waveform.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-[height] duration-75 ${
                  isRecording
                    ? 'bg-gradient-to-t from-violet-600 to-lavender-400'
                    : 'bg-ink-700'
                }`}
                style={{
                  height: `${h * 100}%`,
                  minHeight: '4px',
                }}
              />
            ))}
          </div>
        </div>

        {/* Mic error */}
        {micError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{micError}</span>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px bg-gradient-to-r from-transparent to-violet-500/30 flex-1" />
          <span className="text-xs text-slate-500 font-medium tracking-wider">OR</span>
          <div className="h-px bg-gradient-to-l from-transparent to-violet-500/30 flex-1" />
        </div>

        {/* Drag-and-drop upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            Upload an audio file
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-all ${
              isDragging
                ? 'border-violet-400/60 bg-violet-500/15 shadow-glow-sm'
                : 'border-violet-500/25 bg-ink-800/40 hover:border-violet-400/45 hover:bg-violet-500/5'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-11 h-11 rounded-xl bg-violet-500/15 text-violet-300 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-violet-200">Click to browse</span> or
                drag &amp; drop an audio file
              </p>
              <p className="text-xs text-slate-500">
                WAV, MP3, OGG, WebM, FLAC · up to {MAX_FILE_SIZE / 1024 / 1024} MB · max {MAX_DURATION_SECONDS}s
              </p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={onFileInputChange}
            className="hidden"
          />
          {uploadError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Audio preview + analyze */}
        {audioSource && (
          <div className="space-y-4 rounded-xl border border-violet-500/20 bg-ink-800/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{audioSource.name}</p>
                <p className="text-xs text-slate-500">
                  Duration: {formatDuration(audioSource.duration)}
                </p>
              </div>
              <button
                onClick={togglePlay}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2 text-sm font-semibold text-white hover:shadow-glow-sm active:scale-95 transition-all disabled:opacity-50"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
            </div>
            <audio
              ref={audioRef}
              src={audioSource.url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {modelStatus === 'loading' ? 'Loading Model...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze Speech
                  </>
                )}
              </button>
              <span className="text-xs text-slate-500">{modelStatusLabel}</span>
            </div>
          </div>
        )}

        {/* Model error */}
        {modelStatus === 'error' && modelError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong className="text-red-200">Model Error:</strong> {modelError}. The speech emotion model needs to
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

        {/* Results */}
        {predictions.length > 0 && topPrediction && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <div className="rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-violet-700/10 px-5 py-4 shadow-glow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-1">
                Top Speech Emotion Estimate
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
                Model confidence score — a speech-emotion estimate, not a mental-health diagnosis.
              </p>
            </div>

            {/* Top 3 breakdown */}
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                Top Emotion Confidence Scores
              </h3>
              <ConfidenceBars
                predictions={predictions.slice(0, 3)}
                emotionColors={speechEmotionColors}
              />
            </div>

            {/* All scores */}
            {predictions.length > 3 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  All Emotion Confidence Scores ({SUPPORTED_LABELS.length} classes)
                </h3>
                <ConfidenceBars
                  predictions={predictions}
                  emotionColors={speechEmotionColors}
                />
              </div>
            )}

            {/* Supportive, non-diagnostic message — visually separate */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-xs text-slate-300 leading-relaxed">
              <p className="font-medium text-cyan-300 mb-1">A note on these results</p>
              This is an automated estimate based on acoustic features of your voice.
              It is not a diagnosis of depression, anxiety, or any mental-health condition.
              If you are feeling overwhelmed, consider talking to someone you trust or a
              qualified mental-health professional.
            </div>

            <button
              onClick={handleReset}
              disabled={analyzing}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-ink-800/60 px-5 py-2.5 text-sm font-semibold text-violet-200 hover:border-violet-400/50 hover:bg-violet-500/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
