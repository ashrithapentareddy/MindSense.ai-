import { Brain, Mic, ScanFace, Type, Activity } from 'lucide-react';

type Props = {
  modelStatus: string;
};

const modalityIcons = {
  text: Type,
  face: ScanFace,
  speech: Mic,
};

type Modality = {
  key: keyof typeof modalityIcons;
  title: string;
  status: 'Active' | 'Planned';
  description: string;
};

const modalities: Modality[] = [
  {
    key: 'text',
    title: 'Text Emotion Recognition',
    status: 'Active',
    description:
      'Analyzes written English sentences using a fine-tuned BERT model to classify eight emotions: joy, anger, fear, sadness, surprise, disgust, excitement, and neutral.',
  },
  {
    key: 'face',
    title: 'Facial Expression Recognition',
    status: 'Active',
    description:
      'Captures a frame from your webcam and classifies the facial expression using an ONNX image-classification model. Runs entirely in-browser — no images are uploaded or stored.',
  },
  {
    key: 'speech',
    title: 'Speech Emotion Recognition',
    status: 'Active',
    description:
      'Records or uploads audio and classifies emotion from voice tone and prosody using a fine-tuned wav2vec2 model. Runs entirely in-browser — no audio is uploaded or stored. Supports 7 emotion classes.',
  },
];

const statusStyles: Record<Modality['status'], string> = {
  Active: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
  Planned: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
};

export default function Overview({ modelStatus }: Props) {
  return (
    <section className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-card p-8 sm:p-12">
        <div className="absolute inset-0 bg-grid-faint bg-grid opacity-40" />
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-violet-600/20 blur-[80px]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center shadow-glow">
              <Brain className="w-6 h-6 text-violet-100" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
              CSE Project · AI &amp; ML
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-2 text-white tracking-tight">
            AI-Based Mental Health Monitoring
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-lavender-400 to-cyan-400 bg-clip-text text-transparent">
              Through Emotion Recognition
            </span>
          </h1>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300/70 mb-4">
            MindSense AI
          </p>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl">
            A multimodal emotion recognition system for mental wellness awareness. This
            educational prototype demonstrates how modern transformer models can analyze
            emotional tone in text, facial expressions, and voice — running entirely in
            your browser, with no data sent to any server.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-500/10 border border-violet-400/30 px-4 py-2 text-sm font-medium text-violet-200 backdrop-blur-sm">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                modelStatus === 'ready'
                  ? 'bg-cyan-400 shadow-glow-cyan'
                  : modelStatus === 'loading'
                    ? 'bg-violet-400 animate-pulse'
                    : modelStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-slate-500'
              }`}
            />
            Model Status:{' '}
            <span className="font-semibold capitalize text-white">{modelStatus}</span>
          </div>
        </div>
      </div>

      {/* What is Multimodal Emotion Recognition */}
      <div className="rounded-2xl glass-card glass-card-hover p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-3">
          <Activity className="w-5 h-5 text-violet-400" />
          <h2 className="text-xl font-bold text-white">
            What is Multimodal Emotion Recognition?
          </h2>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Emotion recognition is the task of identifying a person's emotional state from
          observable signals. A <strong className="text-violet-300">multimodal</strong> system combines multiple
          channels — text, facial expressions, voice — to build a richer, more robust
          understanding of how someone is feeling. Each modality captures a different
          aspect of emotional expression: text reveals conscious expression, facial
          expressions reveal subtle reactions, and voice carries prosodic cues like
          pitch and rhythm.
        </p>
        <p className="text-slate-300 leading-relaxed mt-3">
          This project implements the <strong className="text-violet-300">text</strong>, <strong className="text-violet-300">face</strong>, and <strong className="text-violet-300">speech</strong> modalities using
          real transformer and audio-classification models that run entirely in your browser.
        </p>
      </div>

      {/* Three modules */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recognition Modules</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {modalities.map((mod) => {
            const Icon = modalityIcons[mod.key];
            return (
              <div
                key={mod.key}
                className={`group rounded-2xl glass-card glass-card-hover p-5 transition-all ${
                  mod.status === 'Active' ? '' : 'opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                      mod.status === 'Active'
                        ? 'bg-violet-500/15 text-violet-300 group-hover:shadow-glow-sm'
                        : 'bg-slate-700/40 text-slate-500'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusStyles[mod.status]}`}
                  >
                    {mod.status}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {mod.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
