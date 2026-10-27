import { Info, AlertTriangle, Cpu, Code } from 'lucide-react';

export default function AboutMethodology() {
  return (
    <section className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-2">
        <Info className="w-5 h-5 text-violet-400" />
        <h2 className="text-xl font-bold text-white">About &amp; Methodology</h2>
      </div>

      <div className="rounded-2xl glass-card p-6 sm:p-8 space-y-5">
        {/* Model */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white">Model Architecture</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            The text emotion recognition module uses{' '}
            <strong className="text-violet-300">onnx-community/tanaos-emotion-detection-v1-ONNX</strong>, a BERT-based
            model fine-tuned for emotion classification. It classifies input text into eight
            emotion categories: <em>joy, anger, fear, sadness, surprise, disgust, excitement,</em>{' '}
            and <em>neutral</em>. The model runs entirely in your browser via{' '}
            <strong className="text-violet-300">Transformers.js</strong> (the Hugging Face JavaScript runtime) — no data
            is ever sent to a server.
          </p>
        </div>

        {/* Pipeline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-violet-400" />
            <h3 className="font-semibold text-white">Inference Pipeline</h3>
          </div>
          <ol className="list-decimal list-inside text-sm text-slate-300 space-y-1.5 ml-1 marker:text-violet-400">
            <li>Input text is tokenized using the model's subword tokenizer.</li>
            <li>Tokens are passed through the BERT encoder layers.</li>
            <li>A classification head projects the pooled output to eight emotion logits.</li>
            <li>Logits are softmax-normalized into confidence scores per emotion.</li>
            <li>Scores are sorted descending and displayed as confidence bars.</li>
          </ol>
        </div>

        {/* Limitations */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-semibold text-white">Known Limitations</h3>
          </div>
          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1.5 ml-1 marker:text-violet-400">
            <li>Only supports English text; multilingual inputs may produce unreliable results.</li>
            <li>Classifies eight emotion categories — nuanced or mixed emotions are simplified.</li>
            <li>Sarcasm, irony, and implicit context are frequently misclassified.</li>
            <li>The model was trained on labeled datasets and inherits their biases.</li>
            <li>Confidence scores reflect model certainty, not clinical probability.</li>
            <li>Face and speech modalities are now implemented and run entirely in-browser.</li>
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-200 text-sm mb-1">
              Important Disclaimer
            </h3>
            <p className="text-sm text-amber-100/80 leading-relaxed">
              MindSense AI is an <strong>educational prototype</strong> built for a
              college Computer Science (AI &amp; ML) project. It is <strong>not</strong> a
              medical device, clinical diagnostic tool, or substitute for professional
              mental health care. The emotion classifications are produced by a
              machine-learning model and may be inaccurate. If you are experiencing mental
              health challenges, please consult a qualified healthcare professional or a
              licensed therapist. If you are in crisis, contact your local emergency
              services or a crisis helpline immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
