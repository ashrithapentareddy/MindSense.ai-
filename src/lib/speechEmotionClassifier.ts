export type SpeechEmotionPrediction = {
  label: string;
  score: number;
};

export type SpeechModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SpeechProgressCallback = (progress: {
  status: string;
  progress?: number;
}) => void;

type RawClassificationResult = {
  label: string;
  score: number;
};

type AudioClassificationPipeline = {
  (input: Float32Array | Float32Array[], options?: {
    sampling_rate?: number;
    top_k?: number | null;
  }): Promise<unknown>;
};

// The ONNX export of Dpngtm/wav2vec2-emotion-recognition. Its config.json
// defines 7 classes in index order: angry, calm, disgust, fearful, happy,
// sad, surprised. "calm" replaces "neutral" in the original model (per the
// model card, the Calm and Neutral classes were merged). We display the
// model's real labels and do not invent missing classes.
const SPEECH_MODEL_ID = 'onnx-community/wav2vec2-emotion-recognition-ONNX';

let speechClassifierPromise: Promise<AudioClassificationPipeline> | null = null;

async function loadSpeechPipeline(
  onProgress?: SpeechProgressCallback
): Promise<AudioClassificationPipeline> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;

  const pipe = await pipeline('audio-classification', SPEECH_MODEL_ID, {
    progress_callback: (data: { status: string; progress?: number }) => {
      onProgress?.(data);
    },
  });

  return pipe as unknown as AudioClassificationPipeline;
}

export async function getSpeechClassifier(
  onProgress?: SpeechProgressCallback
): Promise<AudioClassificationPipeline> {
  if (!speechClassifierPromise) {
    speechClassifierPromise = loadSpeechPipeline(onProgress);
  }
  return speechClassifierPromise;
}

function toTitleCase(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Decode an AudioBuffer into a mono Float32Array at the buffer's sample rate.
// Wav2Vec2 expects a 1-D waveform; we mix channels down by averaging.
export function audioBufferToMono(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const out = new Float32Array(length);
  for (let ch = 0; ch < channels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      out[i] += data[i] / channels;
    }
  }
  return out;
}

export async function analyzeSpeechEmotion(
  audio: Float32Array,
  samplingRate: number,
  onProgress?: SpeechProgressCallback
): Promise<SpeechEmotionPrediction[]> {
  const classifier = await getSpeechClassifier(onProgress);

  const output = (await classifier(audio, {
    sampling_rate: samplingRate,
    top_k: null,
  })) as unknown;

  let results: RawClassificationResult[];
  if (Array.isArray(output) && output.length > 0 && Array.isArray(output[0])) {
    results = output[0] as RawClassificationResult[];
  } else {
    results = output as RawClassificationResult[];
  }

  return results
    .map((r) => ({ label: toTitleCase(r.label), score: r.score }))
    .sort((a, b) => b.score - a.score);
}

export function resetSpeechClassifier(): void {
  speechClassifierPromise = null;
}
