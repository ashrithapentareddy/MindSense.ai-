import { Clock, Trash2 } from 'lucide-react';
import type { EmotionPrediction } from '@/lib/emotionClassifier';

export type HistoryEntry = {
  id: number;
  text: string;
  predictions: EmotionPrediction[];
  timestamp: Date;
};

type Props = {
  history: HistoryEntry[];
  onClear: () => void;
};

const emotionDotColors: Record<string, string> = {
  joy: 'bg-cyan-400',
  sadness: 'bg-blue-500',
  anger: 'bg-red-500',
  fear: 'bg-violet-400',
  disgust: 'bg-lavender-500',
  excitement: 'bg-violet-500',
  surprise: 'bg-amber-500',
  neutral: 'bg-slate-500',
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AnalysisHistory({ history, onClear }: Props) {
  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">Session History</h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-500/20 bg-ink-800/40 px-6 py-10 text-center">
          <p className="text-sm text-slate-500">
            No analyses yet this session. Try analyzing some text above.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {history.map((entry) => {
            const top = entry.predictions[0];
            const dotColor = emotionDotColors[top?.label] ?? 'bg-slate-500';
            return (
              <div
                key={entry.id}
                className="rounded-xl glass-card glass-card-hover px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm text-slate-200 line-clamp-2 flex-1">
                    "{entry.text}"
                  </p>
                  <span className="text-xs text-slate-500 flex-shrink-0 tabular-nums">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                {top && (
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${dotColor} shadow-glow-sm`} />
                    <span className="text-xs font-semibold text-violet-200 capitalize">
                      {top.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {(top.score * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
