import { useEffect, useState } from 'react';
import { Brain, LayoutDashboard, PenLine, History, Heart, Info, ScanFace, Mic } from 'lucide-react';
import {
  getClassifier,
  type EmotionPrediction,
  type ModelStatus,
} from '@/lib/emotionClassifier';
import Overview from '@/components/Overview';
import TextWorkspace from '@/components/TextWorkspace';
import AnalysisHistory, { type HistoryEntry } from '@/components/AnalysisHistory';
import Recommendations from '@/components/Recommendations';
import AboutMethodology from '@/components/AboutMethodology';
import FaceEmotionCamera from '@/components/FaceEmotionCamera';
import SpeechEmotionRecorder from '@/components/SpeechEmotionRecorder';

type TabKey = 'overview' | 'workspace' | 'camera' | 'speech' | 'history' | 'recommendations' | 'about';

const tabs: Array<{ key: TabKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'workspace', label: 'Analyze Text', icon: PenLine },
  { key: 'camera', label: 'Face Camera', icon: ScanFace },
  { key: 'speech', label: 'Speech', icon: Mic },
  { key: 'history', label: 'History', icon: History },
  { key: 'recommendations', label: 'Suggestions', icon: Heart },
  { key: 'about', label: 'About', icon: Info },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastTopEmotion, setLastTopEmotion] = useState<string | null>(null);

  useEffect(() => {
    setModelStatus('loading');
    getClassifier((progress) => {
      if (progress.status === 'ready') {
        setModelStatus('ready');
      }
    })
      .then(() => {
        setModelStatus('ready');
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load model.';
        console.error('Model loading error:', msg);
        setErrorMsg(msg);
        setModelStatus('error');
      });
  }, []);

  const handleModelStatusChange = (status: ModelStatus, err?: string) => {
    setModelStatus(status);
    if (err) setErrorMsg(err);
  };

  const handleAnalysisComplete = (text: string, predictions: EmotionPrediction[]) => {
    const entry: HistoryEntry = {
      id: Date.now(),
      text,
      predictions,
      timestamp: new Date(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, 20));
    setLastTopEmotion(predictions[0]?.label ?? null);
  };

  const handleClearHistory = () => setHistory([]);

  const statusColor =
    modelStatus === 'ready'
      ? 'bg-cyan-400'
      : modelStatus === 'loading'
        ? 'bg-violet-400'
        : modelStatus === 'error'
          ? 'bg-red-500'
          : 'bg-slate-600';

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-violet-700/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[35rem] h-[35rem] rounded-full bg-violet-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 w-[30rem] h-[30rem] rounded-full bg-cyan-500/8 blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-violet-500/15 bg-ink-950/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center shadow-glow-sm">
                  <Brain className="w-5 h-5 text-white" />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-violet-400/30" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white leading-tight tracking-tight">
                    AI-Based Mental Health Monitoring
                  </h1>
                  <p className="text-xs text-violet-300/70 mt-0.5">
                    MindSense AI · Emotion Recognition
                  </p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-ink-800/80 border border-violet-500/20 px-3 py-1.5 text-xs font-medium text-violet-200">
                <span
                  className={`w-2 h-2 rounded-full ${statusColor} ${modelStatus === 'loading' ? 'animate-pulse' : ''} ${
                    modelStatus === 'ready' ? 'shadow-glow-cyan' : ''
                  }`}
                />
                <span className="capitalize">{modelStatus === 'idle' ? 'Idle' : modelStatus}</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <nav className="flex gap-0.5 -mb-px overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-t-lg ${
                      isActive
                        ? 'text-violet-200'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-violet-500 to-lavender-400 shadow-glow-sm" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Error Banner */}
        {modelStatus === 'error' && errorMsg && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 animate-fade-in">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <strong className="text-red-200">Model Error:</strong> {errorMsg}. Check your network connection and refresh the page — the model needs to download from Hugging Face on first load.
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {activeTab === 'overview' && <Overview modelStatus={modelStatus} />}
          {activeTab === 'workspace' && (
            <TextWorkspace
              modelStatus={modelStatus}
              onModelStatusChange={handleModelStatusChange}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
          {activeTab === 'camera' && <FaceEmotionCamera />}
          {activeTab === 'speech' && <SpeechEmotionRecorder />}
          {activeTab === 'history' && (
            <AnalysisHistory history={history} onClear={handleClearHistory} />
          )}
          {activeTab === 'recommendations' && <Recommendations topEmotion={lastTopEmotion} />}
          {activeTab === 'about' && <AboutMethodology />}
        </main>

        {/* Footer */}
        <footer className="border-t border-violet-500/15 bg-ink-950/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              MindSense AI — Educational Prototype · CSE (AI &amp; ML) Project ·{' '}
              Not a medical diagnostic tool · Text: onnx-community/tanaos-emotion-detection-v1-ONNX · Face: onnx-community/face-emotion-detection-ONNX · Speech: onnx-community/wav2vec2-emotion-recognition-ONNX
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
