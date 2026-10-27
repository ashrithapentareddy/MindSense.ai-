export type EmotionPrediction = {
  label: string;
  score: number;
};

export type ModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export type ProgressCallback = (progress: { status: string; progress?: number }) => void;

type TextClassificationPipeline = {
  (text: string, options?: { top_k?: number | null }): Promise<unknown>;
};

let classifierPromise: Promise<TextClassificationPipeline> | null = null;

const MODEL_ID = 'onnx-community/tanaos-emotion-detection-v1-ONNX';

async function loadPipeline(
  onProgress?: ProgressCallback
): Promise<TextClassificationPipeline> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;

  const pipe = await pipeline('text-classification', MODEL_ID, {
    progress_callback: (data: { status: string; progress?: number }) => {
      onProgress?.(data);
    },
  });

  return pipe as unknown as TextClassificationPipeline;
}

export async function getClassifier(
  onProgress?: ProgressCallback
): Promise<TextClassificationPipeline> {
  if (!classifierPromise) {
    classifierPromise = loadPipeline(onProgress);
  }
  return classifierPromise;
}

export async function analyzeEmotion(
  text: string,
  onProgress?: ProgressCallback
): Promise<EmotionPrediction[]> {
  const classifier = await getClassifier(onProgress);
  // top_k: null returns all labels sorted by score descending.
  const output = (await classifier(text, { top_k: null })) as unknown;

  // The pipeline can return either a flat array or a nested array depending on version.
  let results: Array<{ label: string; score: number }>;
  if (Array.isArray(output) && output.length > 0 && Array.isArray(output[0])) {
    results = output[0] as Array<{ label: string; score: number }>;
  } else {
    results = output as Array<{ label: string; score: number }>;
  }

  return results
    .map((r) => ({ label: r.label, score: r.score }))
    .sort((a, b) => b.score - a.score);
}

export function resetClassifier(): void {
  classifierPromise = null;
}
