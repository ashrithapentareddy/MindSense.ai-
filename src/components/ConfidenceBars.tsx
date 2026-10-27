import type { EmotionPrediction } from '@/lib/emotionClassifier';

type Props = {
  predictions: EmotionPrediction[];
  emotionColors: Record<string, string>;
};

function formatPercent(n: number): string {
  return (n * 100).toFixed(1) + '%';
}

export default function ConfidenceBars({ predictions, emotionColors }: Props) {
  return (
    <div className="space-y-2.5">
      {predictions.map((pred) => {
        const colorClass = emotionColors[pred.label] ?? 'bg-violet-500';
        return (
          <div key={pred.label} className="flex items-center gap-3">
            <span className="w-20 text-xs font-medium text-slate-300 capitalize flex-shrink-0">
              {pred.label}
            </span>
            <div className="flex-1 h-7 rounded-lg bg-ink-800/80 border border-violet-500/10 overflow-hidden relative">
              <div
                className={`h-full ${colorClass} rounded-lg transition-all duration-700 ease-out relative`}
                style={{ width: `${pred.score * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-60" />
              </div>
            </div>
            <span className="w-14 text-xs font-semibold text-violet-200 text-right tabular-nums">
              {formatPercent(pred.score)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
