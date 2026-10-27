import { useCallback, useState } from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import {
  analyzeEmotion,
  type EmotionPrediction,
  type ModelStatus,
} from '@/lib/emotionClassifier';
import ConfidenceBars from './ConfidenceBars';

type Props = {
  modelStatus: ModelStatus;
  onModelStatusChange: (status: ModelStatus, errorMsg?: string) => void;
  onAnalysisComplete: (text: string, predictions: EmotionPrediction[]) => void;
};

const sampleInputs = [
  "I just got accepted into my dream university and I can't stop smiling!",
  "I feel completely empty and don't see the point of anything anymore.",
  "How dare they speak to me like that after everything I've done for them!",
  "I'm so worried about the results, I barely slept last night.",
];

const emotionColors: Record<string, string> = {
  joy: 'bg-cyan-400',
  sadness: 'bg-blue-500',
  anger: 'bg-red-500',
  fear: 'bg-violet-400',
  disgust: 'bg-lavender-500',
  excitement: 'bg-violet-500',
  surprise: 'bg-amber-500',
  neutral: 'bg-slate-500',
};

function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export default function TextWorkspace({
  modelStatus,
  onModelStatusChange,
  onAnalysisComplete,
}: Props) {
  const [text, setText] = useState('');
  const [predictions, setPredictions] = useState<EmotionPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter some text to analyze.');
      return;
    }
    setError(null);
    setLoading(true);

    if (modelStatus !== 'ready') {
      onModelStatusChange('loading');
    }

    try {
      const results = await analyzeEmotion(trimmed, (progress) => {
        if (progress.status === 'ready') {
          onModelStatusChange('ready');
        }
      });
      setPredictions(results);
      onAnalysisComplete(trimmed, results);
      onModelStatusChange('ready');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error during inference.';
      setError('Model inference failed: ' + msg);
      onModelStatusChange('error', msg);
    } finally {
      setLoading(false);
    }
  }, [text, modelStatus, onModelStatusChange, onAnalysisComplete]);

  const isDisabled = loading || modelStatus === 'loading';

  const topPrediction = predictions[0];

  return (
    <section className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">Text Analysis Workspace</h2>
      </div>

      <div className="rounded-2xl glass-card p-6 sm:p-8 space-y-5">
        {/* Textarea */}
        <div>
          <label htmlFor="emotion-text" className="block text-sm font-medium text-slate-300 mb-2">
            Enter an English sentence to analyze
          </label>
          <textarea
            id="emotion-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            rows={4}
            placeholder="e.g., I had the most wonderful day and feel incredibly grateful."
            className="w-full rounded-xl bg-ink-800/80 border border-violet-500/15 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none transition-all resize-none text-sm leading-relaxed"
            disabled={loading}
          />
        </div>

        {/* Sample inputs */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Try a sample input:</p>
          <div className="flex flex-wrap gap-2">
            {sampleInputs.map((sample, i) => (
              <button
                key={i}
                onClick={() => {
                  setText(sample);
                  setError(null);
                }}
                disabled={loading}
                className="text-xs rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1.5 text-violet-200 hover:border-violet-400/40 hover:bg-violet-500/15 hover:text-violet-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sample {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isDisabled}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 px-6 py-2.5 text-sm font-semibold text-white shadow-glow-sm hover:shadow-glow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {modelStatus === 'loading' ? 'Loading Model...' : 'Analyzing...'}
              </>
            ) : (
              <>Analyze Emotion</>
            )}
          </button>
          {(predictions.length > 0 || error) && (
            <button
              onClick={() => {
                setPredictions([]);
                setError(null);
              }}
              disabled={loading}
              className="text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {predictions.length > 0 && topPrediction && (
          <div className="space-y-4 pt-2 animate-fade-in">
            <div className="rounded-xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-violet-700/10 px-5 py-4 shadow-glow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-300 mb-1">
                Top Prediction
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
                Model confidence — not a clinical probability.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">
                All Emotion Confidence Scores
              </h3>
              <ConfidenceBars predictions={predictions} emotionColors={emotionColors} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
