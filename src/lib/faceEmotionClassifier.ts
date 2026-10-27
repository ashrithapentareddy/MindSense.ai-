export type FaceEmotionPrediction = {
  label: string;
  score: number;
};

export type FaceModelStatus = 'idle' | 'loading' | 'ready' | 'error';

export type FaceProgressCallback = (progress: {
  status: string;
  progress?: number;
}) => void;

type RawClassificationResult = {
  label: string;
  score: number;
};

type ImageClassificationPipeline = {
  (input: unknown, options?: { top_k?: number | null }): Promise<unknown>;
};

// The model's config.json only defines generic LABEL_0..LABEL_6.
// The model card (onnx-community/face-emotion-detection-ONNX, based on
// abhilash88/face-emotion-detection, trained on FER2013) explicitly lists
// the 7 emotion classes in index order:
//   0: Angry, 1: Disgust, 2: Fear, 3: Happy, 4: Sad, 5: Surprise, 6: Neutral
const LABEL_MAP: Record<string, string> = {
  LABEL_0: 'Angry',
  LABEL_1: 'Disgust',
  LABEL_2: 'Fear',
  LABEL_3: 'Happy',
  LABEL_4: 'Sad',
  LABEL_5: 'Surprise',
  LABEL_6: 'Neutral',
};

let faceClassifierPromise: Promise<ImageClassificationPipeline> | null = null;

const FACE_MODEL_ID = 'onnx-community/face-emotion-detection-ONNX';

async function loadFacePipeline(
  onProgress?: FaceProgressCallback
): Promise<ImageClassificationPipeline> {
  const { pipeline, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;

  const pipe = await pipeline('image-classification', FACE_MODEL_ID, {
    progress_callback: (data: { status: string; progress?: number }) => {
      onProgress?.(data);
    },
  });

  return pipe as unknown as ImageClassificationPipeline;
}

export async function getFaceClassifier(
  onProgress?: FaceProgressCallback
): Promise<ImageClassificationPipeline> {
  if (!faceClassifierPromise) {
    faceClassifierPromise = loadFacePipeline(onProgress);
  }
  return faceClassifierPromise;
}

function mapLabel(rawLabel: string): string {
  const mapped = LABEL_MAP[rawLabel];
  if (mapped) return mapped;
  // If the label is already a human-readable name, return it as-is.
  // Otherwise return the raw label so the user can see something is wrong.
  return rawLabel.startsWith('LABEL_') ? rawLabel : rawLabel;
}

export async function analyzeFaceEmotion(
  imageInput: unknown,
  onProgress?: FaceProgressCallback
): Promise<FaceEmotionPrediction[]> {
  const classifier = await getFaceClassifier(onProgress);

  const output = (await classifier(imageInput, { top_k: null })) as unknown;

  let results: RawClassificationResult[];
  if (Array.isArray(output) && output.length > 0 && Array.isArray(output[0])) {
    results = output[0] as RawClassificationResult[];
  } else {
    results = output as RawClassificationResult[];
  }

  return results
    .map((r) => ({ label: mapLabel(r.label), score: r.score }))
    .sort((a, b) => b.score - a.score);
}

export function resetFaceClassifier(): void {
  faceClassifierPromise = null;
}
